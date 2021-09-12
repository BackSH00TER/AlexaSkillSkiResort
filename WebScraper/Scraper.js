const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('./AWS_Helpers');
const fs = require('fs');

//--------------CALL LAMBDA TEST TO RUN exports.handler locally--------------------
// TODO: If stuff doesnt work when this is uploaded ther used to be an exports.handled = { ... }
//    may need to re-add this if it doesnt work

/**
 * This function loads a site and then uses a set of selectors to scrape data from the website.
 * @param {string} resortUrl - The URL of the site that is going to be scraped
 * @param {string} resortId - The ID of the resort
 * @returns {object} { resort: string, type: {selectorData} }
 */
const scrapeSite = async (resortUrl, resortId) => {
  console.log('Scraping site for:', resortId, resortUrl);

  try {
    const $ = await rp({
      uri: resortUrl,
      transform: function (body) {
        return cheerio.load(body);
      }
    });

    // Data selectors for the OnTheSnow site
    const dataSelectors = {
      overNightSnowFall:  $($('.snow_report_content.src_left .currentSnowAmt')).text().slice(0, -1),
      snowFallOneDay:     $($('.snow_report_content.src_left .currentSnowAmt')).text().slice(0, -1),
      snowFallTwoDay:     $($('.snow_report_content.src_middle .currentSnowAmt')).text().slice(0, -1),
      snowDepthBase:      $($('#view .item strong')[2]).text().slice(0, -1).trim(),
      snowDepthMidMtn:    $($('#view .item strong')[4]).text().slice(0, -1).trim(),
      seasonSnowFall:     $($('#view .item strong')[0]).text().slice(0, -1).trim()
    };
    
    return {
      resort: resortId,
      type: { ...dataSelectors }
    };
  } catch (error) {
    const errMsg = `WebScraper failed with error: ${error}`
    console.log(errMsg);
    return { error: errMsg };
  }
}

/**
 * Returns file name for each resort
 * @param {string} pathToFiles - path to where resort files are stored
 * @returns an array containing each resorts file name (ex: ["stevens.json", ...])
 */
const getListOfFiles = async (pathToFiles) => {
  try {
    const resortFileNames = await fs.promises.readdir(pathToFiles);
    return resortFileNames;
  } catch (error) {
    console.log('Failed to get resort file names. Error: ', error);
  }
}

/**
 * Loops over the scrapeData and replaces any empty strings with "FAIL"
 * This is used for easier indication in DynamoDB table of a selector failing to scrape the result
 * @param {*} data - the scrapedData
 * @returns the updated data
 */
const markInvalidData = (data) => {
  // Before sending data, loop over and check for blank value
  // A blank value indicates selector failed to get value from website (probably broken selector)
  for (var res in data.type) {
    if(data.type[res] === "") {
      console.log("Data of : " + data.resort + " " + res + " is blank, setting it to 'FAIL'"); //TODO find way to alert of this
      data.type[res] = "FAIL";
    }
  }
  return data;
}

/**
 * Uploads the resort data to the DynamoDB table
 * @param {*} data - scraped resort data to upload 
 */
const uploadToDatabase = async (data) => {
  console.log("Adding data to database...");
  const params = {
    TableName: "SkiResortData",
    Item: {
      "resort": data.resort,
      "overNightSnowFall": data.type.overNightSnowFall,
      "snowFallOneDay": data.type.snowFallOneDay,
      "snowFallTwoDay": data.type.snowFallTwoDay,
      "snowDepthBase": data.type.snowDepthBase,
      "snowDepthMidMtn": data.type.snowDepthMidMtn,
      "seasonSnowFall": data.type.seasonSnowFall
    }
  };

  db.putData(params, (response) => {
    if (response == "FAILED") {
      console.log("Database Error: Unable to add data for resort: " + params.Item.resort);
    }

    console.log('Data successfully uploaded.')
  });
}

/**
 * 
 * @param {boolean} shouldUploadToDB - true/false, should only be false when testing
 * @param {string} resortFile - only webscrape the specific result for this resort, only used when testing (ex: "stevens.json")
 * @returns 
 */
const executeWebScraper = async (shouldUploadToDB, resortFile = null) => {
  // Gets an array of resort file names
  const resortsList = await getListOfFiles(`${__dirname}/resorts`);

  // Loop through each resort, scrape it, and upload to DB
  for (resortFileName of resortsList) {
    // This should only execute for local testing when a specific resort is passed in
    // Skips over other resorts and only does the logic if the resort matches
    if (resortFile && resortFileName !== resortFile) { 
      continue;
    }
    
    // Uses passed in file name else uses the file name from the loop
    const resortFilePath = !!resortFile ? resortFile : resortFileName;

    // Get data from resort file
    const resortMetaDataRaw = await fs.promises.readFile(`${__dirname}/resorts/${resortFilePath}`);
    const resortMetaData = JSON.parse(resortMetaDataRaw);

    // Get data from website
    const scrapedData = await scrapeSite(resortMetaData.url, resortMetaData.id);

    // If we have an error on scrapedData, it means we failed to scrape for this resort
    if (scrapedData.error) {
      console.log('WebScraperError: ', error);
      continue;
    }

    // Check for any invalid fields and mark them as "FAIL"
    // This makes it easy to tell where errors occured in the scraping process
    const updatedScrapedData = markInvalidData(scrapedData);
    console.log('updatedScrapedData', updatedScrapedData);

    // Upload the scraped data to the DynamoDB table
    shouldUploadToDB && await uploadToDatabase(updatedScrapedData);
  };
};

// Uncomment the line below when testing locally
// Make sure to reset params before uploading!!
// executeWebScraper(false, "stevens.json");

// For running scraper locally and uploading to DB
// const testScraper = async () => {
//   await executeWebScraper(true);
// }
// testScraper();

exports.handler = async (event, context) => {
  await executeWebScraper(true);
}