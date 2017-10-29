const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('./AWS_Helpers');

//TODO: Scraper file for each site to scrape?
//TODO: Add additional for lifts
//TODO: Will probably just report num lifts open / total instead of specific ones
//TODO: COuld report frontside/backside lifts or output to the card which lifts are clsoed/open


exports.handler = function(event, context, callback) {
    //Gets response of all data scraped
    //Puts the data into table
    scrapeSite((data) => {
        if (data === "ERROR") {
            //TODO: Handle error msg
            console.log("Error occurred in scraping Stevens Pass website");
        } else {
            var params = {
                TableName: "SkiResortData",
                Item: {
                    "resort": "Stevens Pass",
                    "overNightSnowFall": data.overNightSnowFall,
                    "snowFallOneDay": data.snowFallOneDay,
                    "snowFallTwoDay": data.snowFallTwoDay,
                    "snowDepthBase": data.snowDepthBase,
                    "snowDepthMidMtn": data.snowDepthMidMtn,
                    "seasonSnowFall": data.seasonSnowFall
                }
            };

            //Push this data to the database
            console.log("Adding data to database...");
            db.putData(params, (response) => {
                if (response == "FAILED") {
                    console.log("Error: Unable to add Stevens Pass data");
                }
                else {
                    console.log("Data push successful");
                }
            });
        }
    });
}

function scrapeSite(callback) {
    const options = {
        uri: 'https://www.stevenspass.com/site/mountain/reports/snow-and-weather-report/@@snow-and-weather-report',
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    console.log("Fetching data from site...");
    rp(options)
        .then(($) => {
            console.log("Data received");
            var reportDateUpdated = $('.page-report-snowfall-value');
            var snowFallTotals = $('.page-report-snowfall-value');
            var snowDepthTotals = $('.page-report-snowdepth-value');

            var data = {
                reportDateUpdated: $(reportDateUpdated).text(),
                overNightSnowFall: $(snowFallTotals[0]).text().slice(0, -1),
                snowFallOneDay: $(snowFallTotals[1]).text().slice(0, -1),
                snowFallTwoDay: $(snowFallTotals[2]).text().slice(0, -1),
                snowDepthBase: $(snowDepthTotals[0]).text().slice(0, -1),
                snowDepthMidMtn: $(snowDepthTotals[1]).text().slice(0, -1),
                seasonSnowFall: $(snowDepthTotals[2]).text().slice(0, -1)
            };

            callback(data);
        })
        .catch((err) => {
            console.log(err);
            callback("ERROR");
        });
};