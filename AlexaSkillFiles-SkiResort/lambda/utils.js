const db = require('./AWS_Helpers');
const Alexa = require('ask-sdk');
const fetch = require('node-fetch');

const NOT_SUPPORTED = "NOT_SUPPORTED";
const TERMINAL_ERROR = "TERMINAL_ERROR";
const INVALID_DAY = "INVALID_DAY";
const NO_DATA_FOR_DAY = "NO_DATA_FOR_DAY";
const NO_DATA = "N/A";
const DB_READ_ERROR = "DB_READ_ERROR";


/**
 * Checks that the a valid day of the week is being used
 * @param {string} day 
 * @returns true/false
 */
const isValidDayOfTheWeek = (day) => {
  const daysOfTheWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return daysOfTheWeek.indexOf(day.toLowerCase()) > -1;
};

/**
 * Returns the slotID and value for the resort in the IntentRequest
 * @param {object} resortsSlot - from the IntentRequest (ex: 'this.event.request.intent.slots.Resort')
 * @returns {object} {resortSlotID, synonymValue}
 */
const getResortSlotIdAndName = async (resortSlot) => {
  console.log('Attempting to get resortSlotIdAndName for:', resortSlot);
  let synonymValue = resortSlot && resortSlot.value || "Unknown";
  let resortSlotID;
  let resortName;

  // Attempt to get resortSlotID
  if (
    resortSlot.resolutions &&
    resortSlot.resolutions.resolutionsPerAuthority &&
    resortSlot.resolutions.resolutionsPerAuthority[0] &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status.code &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_MATCH"
  ) {
    resortSlotID = resortSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    resortName = resortSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
  }

  await exportFunctions.updateDBUniqueResortCounter(resortSlotID, synonymValue);

  console.log(`getResortSlotIdAndName returning: resortSlotID: ${resortSlotID}, resortName: ${resortName}, synonymValue: ${synonymValue}`);
  return {
    resortSlotID,
    resortName,
    synonymValue
  }
}

/**
 * Updates the resort counter on the DynamodDB table that tracks the resorts used in the skill
 * @param {string} resortSlotID 
 * @param {string} synonymValue 
 */
const updateDBUniqueResortCounter = async (resortSlotID, synonymValue) => {
  const resort = !!resortSlotID ? resortSlotID : synonymValue;
  const params = {
    TableName: "SkiResortTracking",
    Key: {
      "resort": resort
    },
    UpdateExpression: "ADD resortCounter :val",
    ExpressionAttributeValues: {
      ":val":1
    },
    ReturnValues: "UPDATED_NEW"
  }

  console.log('Updating DB Resort Counter...');
  await db.updateResortCount(params);
}

// Weather API related code
// These are the gridpoints used for the weather API
// The comment is the LAT, LON used to get the gridpoint
const resortWeatherGridpoints = {
  Crystal_Mountain:   'SEW/144,30',   // 46.9291,-121.501
  Mount_Baker:        'SEW/156,122',  // 48.8541,-121.68
  Snoqualmie_Pass:    'SEW/151,53',   // 47.4374,-121.4154
  Stevens_Pass:       'SEW/164,66',   // 47.7459,-121.0891
  Mission_Ridge:      'OTX/42,89',    // 47.2867,-120.4184
  Schweitzer:         'OTX/171,120',  // 48.3799,-116.6339
  Mount_Hood_Meadows: 'PQR/143,88',   // 45.3419,-121.6689
  Mount_Hood_Skibowl: 'PQR/139,87',   // 45.3017,-121.7725
  Timberline_Lodge:   'PQR/135,95',   // 45.454350,-121.933136
  Mount_Bachelor:     'PDT/22,39',    // 43.9889,-121.6818
  Sun_Valley:         'PIH/38,93',    // 43.6826586,-114.3763201
  Mammoth_Mountain:   'REV/56,16',    // 37.630768,-119.032631
  Big_Bear_Mountain:  'SGX/76,78',    // 34.236346,-116.8890035
  Breckenridge:       'BOU/24,52',    // 39.4802,-106.0667
  Alta:               'SLC/107,166',  // 40.5902,-111.6391
  Beaver_Mountain:    'SLC/118,228',  // 41.9681,-111.5441
  Brian_Head_Resort:  'SLC/48,41',    // 37.7021,-112.8499
  Brighton:           'SLC/109,166',  // 40.5991,-111.5813
  Deer_Valley:        'SLC/113,167',  // 40.6374,-111.4783
  Eagle_Point:        'SLC/68,67',    // 38.3203,-112.3839
  Nordic_Valley:      'SLC/103,199',  // 41.3104,-111.8648
  Park_City:          'SLC/112,168',  // 40.6514,-111.5080
  Powder_Mountain:    'SLC/107,202',  // 41.3790,-111.7807
  Snowbasin:          'SLC/103,195',  // 41.2160,-111.8569
  Snowbird:           'SLC/107,165',  // 40.5833,-111.6508
  Solitude:           'SLC/109,167',  // 40.6211,-111.5933
  Sundance:           'SLC/108,157',  // 40.3934,-111.5888
  Blacktail_Mountain: 'MSO/100,186',  // 48.01420,-114.3692
  Whitefish_Mountain: 'MSO/104,208',  // 48.4819,-114.3494
  Mount_Washington:   'NOT_SUPPORTED' // 49.73833,-125.2986
};

/**
 * Returns an array of all the supported resort names
 */
const getSupportedResorts = async () => {
  return [
    "Crystal Mountain",
    "Mount Baker",
    "Snoqualmie Pass",
    "Stevens Pass",
    "Mission Ridge",
    "Schweitzer",
    "Mount Hood Meadows",
    "Mount Hood Skibowl",
    "Timberline Lodge",
    "Mount Bachelor",
    "Sun Valley",
    "Mammoth Mountain",
    "Big Bear Mountain",
    "Breckenridge",
    "Alta",
    "Beaver Mountain",
    "Brian Head Resort",
    "Brighton",
    "Deer Valley",
    "Eagle Point",
    "Nordic Valley",
    "Park City",
    "Powder Mountain",
    "Snowbasin",
    "Snowbird",
    "Solitude",
    "Sundance",
    "Blacktail Mountain",
    "Whitefish Mountain",
    "Mount Washington",
  ];
}

/**
 * Makes a network request to the WeatherAPI to get the forecast for the given resort
 * @param {string} resortID 
 * @returns JSON formatted object of the weather forecast for the week.
 * It returns error NOT_SUPPORTED if the resortId is not supported by the Weather API
 * If there are any errors, it returns a TERMINAL_ERROR
 */
const getWeatherRequest = async (resortID) => {
  console.log(`Requesting weather for ${resortID}`);
  const gridpoint = resortWeatherGridpoints[resortID];
  
  // End early if resortID is not supported
  if (gridpoint === NOT_SUPPORTED) {
    return { data: undefined, error: NOT_SUPPORTED };
  }
  
  const path = `/gridpoints/${gridpoint}/forecast`;
  const options = {
    host: 'api.weather.gov',
    path: path,
    method: 'GET',
    headers: {
        'user-agent': 'Snow-Report (hildeapps@gmail.com)',
        'accept': 'application/json'
    }
  };

  try {
    const data = await fetch(`https://api.weather.gov${path}`, options);
    const jsonData = await data.json();
    console.log('getWeatherRequest response: ', jsonData);
    return { data: jsonData, error: undefined };
  } catch (error) {
    console.error(`Error fetching Weather info for ${resortID}: ${error}`);
    return { data: undefined, error: TERMINAL_ERROR };
  }
};

const isValidForecastData = (forecastData) => {
  return !!(forecastData && forecastData.properties && forecastData.properties.periods);
}

/**
 * Gets the weather for today
 * @param {string} resortID 
 * @returns {object} {detailedForecast?: string, error?: string}
 * Returns the detailedForecast for today on success
 * Returns any errors that are returned from getWeatherRequest
 */
const getForecastToday = async ({resortID}) => {
  const { data, error } = await exportFunctions.getWeatherRequest(resortID);

  if (error || !isValidForecastData(data)) {
    return { forecastData: undefined, error: error || true };
  }

  const forecastPeriods = data.properties.periods;

  // If the first result has isDaytime = false, then it will only have one result for "Tonight", otherwise it will have two results for today
  const isFirstPeriodNight = !forecastPeriods[0].isDaytime;

  const forecastData = {
    day: forecastPeriods[0].name,
    tempHigh: isFirstPeriodNight ? NO_DATA : forecastPeriods[0].temperature,
    tempLow: isFirstPeriodNight ? forecastPeriods[0].temperature : forecastPeriods[1].temperature,
    shortForecast: forecastPeriods[0].shortForecast,
    detailedForecast: forecastPeriods[0].detailedForecast,
    iconUrl: forecastPeriods[0].icon
  };

  return {
    forecastData,
    error: undefined
  };
};

/**
 * Gets the forecast for the week
 * @param {string} resortID 
 * @returns {object} Object containing an array of forecast data or an error
 * {
 *   forecastData?: [{day, tempHigh, tempLow, shortForecast, detailedForecast}],
 *   error?: string
 * }
 * Returns any errors that are returned from getWeatherRequest
 */
const getForecastWeek = async ({resortID}) => {
  const { data, error } = await exportFunctions.getWeatherRequest(resortID);
  
  if (error || !isValidForecastData(data)) {
    return { forecastData: undefined, error: error || true };
  }

  const forecastPeriods = data.properties.periods;

  // If the first result has isDaytime = false, then it will only have one result for "Tonight"
  // In addition it means that the very last result will also only return one result, the "day" portion
  // To make sure that we always have a tempHigh and a tempLow, we skip the first and last results in this case
  const isFirstPeriodNight = !forecastPeriods[0].isDaytime;
  const startIndex = isFirstPeriodNight ? 1 : 0;
  const endIndex = isFirstPeriodNight ? forecastPeriods.length - 1 : forecastPeriods.length;

  let forecastData = [];

  for (let i = startIndex; i < endIndex; i += 2) {
    forecastData.push({
      day: forecastPeriods[i].name,
      tempHigh: forecastPeriods[i].temperature,
      tempLow: forecastPeriods[i + 1].temperature,
      shortForecast: forecastPeriods[i].shortForecast,
      detailedForecast: forecastPeriods[i].detailedForecast,
      iconUrl: forecastPeriods[i].icon
    });
  }

  return {
    forecastData,
    error: undefined
  };
};

/**
 * Gets the forecast for the specified day
 * @param {string} resortID 
 * @param {string} day - day of the week
 * @returns Object containing forecast data or an error
 * {
 *   forecastData?: [{day, tempHigh, tempLow, shortForecast, detailedForecast}],
 *   error?: string
 * }
 * Returns any errors that are returned from getWeatherRequest
 * Returns INVALID_DAY if the day passed in does not match a day of the week
 */
const getForecastWeekDay = async ({resortID, daySlotValue: day}) => {
  const { forecastData, error } = await exportFunctions.getForecastWeek({resortID});

  if (error) {
    return { forecastData: undefined, error };
  }

  // Make sure user said a valid day
  // Ex: In some cases a holiday name could replace the name of the day in the field
  if (!isValidDayOfTheWeek(day)) {
    console.warn("Invalid day of the week used: ", day);
    return { forecastData: undefined, error: INVALID_DAY };
  }

  const forecastDataForSpecificDay = forecastData.find(data => data.day.toLowerCase() === day.toLowerCase());
  // Make sure we have data for the specified day
  // Ex: If they ask for Friday and today is Friday, we only have up to next Thursday
  const noDataForDayError = !forecastDataForSpecificDay ? NO_DATA_FOR_DAY : undefined;

  return {
    forecastData: forecastDataForSpecificDay,
    error: noDataForDayError
  };
};

/**
 * Gets the weather for tomorrow
 * @param {string} resortID 
 * @returns {object} {forecastData?: string, error?: string}
 * Returns the forecastData for tomorrow on success
 * Returns any errors that are returned from getWeatherRequest
 */
const getForecastTomorrow = async ({resortID}) => {
  const { data, error } = await exportFunctions.getWeatherRequest(resortID);
  
  if (error || !isValidForecastData(data)) {
    return { forecastData: undefined, error: error || true };
  }

  const forecastPeriods = data.properties.periods;

  // If the first result has isDaytime = false, then it will only have one result for "Tonight", otherwise it will have two results for today
  const isFirstPeriodNight = !forecastPeriods[0].isDaytime;
  const startIndex = isFirstPeriodNight ? 1 : 2;

  const forecastData = {
    day: forecastPeriods[startIndex].name,
    tempHigh: forecastPeriods[startIndex].temperature,
    tempLow: forecastPeriods[startIndex + 1].temperature,
    shortForecast: forecastPeriods[startIndex].shortForecast,
    detailedForecast: forecastPeriods[startIndex].detailedForecast,
    iconUrl: forecastPeriods[startIndex].icon
  };

  return {
    forecastData,
    error: undefined
  };
};

const getSnowReportData = async (resortID) => {
  const params = {
    TableName: "SkiResortData",
    Key: {
      "resort": resortID
    }
  };

  const data = await db.getData(params);

  if (!data) {
    console.log('Error: Data returned is missing the Item object')
    return {
      snowReportData: undefined,
      error: DB_READ_ERROR
    };
  }

  return {
    snowReportData: {
      resort: data.Item.resort,
      snowDepthBase: data.Item.snowDepthBase,
      snowDepthMidMtn: data.Item.snowDepthMidMtn,
      seasonSnowFall: data.Item.seasonSnowFall,
      snowFallOvernight: data.Item.overNightSnowFall,
      snowFallOneDay: data.Item.snowFallOneDay,
      snowFallTwoDay: data.Item.snowFallTwoDay
    },
    error: undefined
  };
};

/**
 * Adds the APL directive (visual part) to the response if the users device supports APL
 */
const addAPLIfSupported = ({handlerInput, token, document, data = {}}) => {
  if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
    handlerInput.responseBuilder
      .addDirective({
        "type": "Alexa.Presentation.APL.RenderDocument",
        "token": token,
        "document": document,
        "datasources": {
          "data": data
        }
      });
  }
};

/**
 * Returns the subtitle text based on the handlerName
 */
const getSubtitleTextForHandler = ({handlerName, data}) => {
  let subtitle;

  switch(handlerName) {
    case 'forecastToday':
    case 'temperatureToday':
      subtitle = "Today's Forecast";
      break;
    case 'forecastTomorrow':
      subtitle = "Tomorrow's Forecast";
      break;
    case 'forecastWeekDay':
    case 'temperatureWeekDay':
      const day = data.daySlotValue;
      subtitle = `${day}'s Forecast`;
      break;
    case 'forecastWeek':
      subtitle = "7 Day Forecast";
      break;    
    case 'snowReportDepth':
    case 'snowReportOneDay':
    case 'snowReportOvernight':
      subtitle = "Snow Report";
      break;
    case 'snowReportSeasonTotal':
      subtitle = "Season Total";
      break;
    default:
      subtitle = "Snow Report";
      break;
  };

  return subtitle;
};

/**
 * Returns the URL of the correct icon to display based on the weather
 * Takes the iconUrl from the weather API and maps it to the corresponding icon from my set
 * Example url: https://api.weather.gov/icons/land/day/rain_showers,20/tsra_sct,40?size=medium
 * The URL could contain two different types of weather, we check for a match and only return
 * one result based on order of importance
 */
const getIconUrl = ({iconUrlFromWeatherAPI, showAsError}) => {
  const assetUrl = "https://snowreportskill-assets.s3.amazonaws.com";

  if (showAsError) {
    return `${assetUrl}/icon-cloud-slash.png`;
  }

  /**
   * These are the various weatherTypes returned by Weather API that this app is supporting
   * The array is sorted in order of importance, the first match will be used
   * Full set of icons can be found at: https://api.weather.gov/icons
   */
  const weatherTypes = [
    // Snow
    "snow",
    "blizzard",
    "cold",
    // Sleet (mixed rain/snow)
    "rain_snow",
    "rain_sleet",
    "snow_sleet",
    "rain_fzra",
    "snow_fzra",
    "fzra",
    "sleet",
    // Rain-heavy
    "rain_showers_hi",
    // Rain-light
    "rain_showers",
    "rain",
    // Thunderstorm
    "tsra",
    "tsra_sct",
    "tsra_hi",
    // Wind
    "wind_skc",
    "wind_few",
    "wind_sct",
    "wind_bkn",
    "wind_ovc",
    // Sunny
    "skc",
    "few",
    "hot",
    // Partly-sunny
    "sct",
    "bkn",
    // Cloudy
    "ovc",
    // Fog
    "fog"
  ];

  // Returns the first matched variable from weatherTypes
  const firstMatchedWeatherType = weatherTypes.find(type => iconUrlFromWeatherAPI.includes(type));

  // Get the path / png name for the given weatherType
  const getIconPath = (weatherType) => {
    let path;

    switch (weatherType) {
    // Snow
    case "snow":
    case "blizzard":
    case "cold":
      path = "icon-snow.png";
      break;
    // Sleet (mixed rain/snow)
    case "rain_snow":
    case "rain_sleet":
    case "snow_sleet":
    case "rain_fzra":
    case "snow_fzra":
    case "fzra":
    case "sleet":
      path = "icon-sleet.png";
      break;
    // Rain-heavy
    case "rain_showers_hi":
      path = "icon-rain-heavy.png";
      break;
    // Rain-light
    case "rain_showers":
    case "rain":
      path = "icon-rain-light.png";
      break;
    // Thunderstorm
    case "tsra":
    case "tsra_sct":
    case "tsra_hi":
      path = "icon-thunderstorm.png";
      break;
    // Wind
    case "wind_skc":
    case "wind_few":
    case "wind_sct":
    case "wind_bkn":
    case "wind_ovc":
      path = "icon-wind.png";
      break;
    // Sunny
    case "skc":
    case "few":
    case "hot":
      if (iconUrlFromWeatherAPI.includes("night")) {
        path = "icon-night.png";
      } else {
        path = "icon-sunny.png";
      }      
      break;
    // Partly-sunny
    case "sct":
    case "bkn":
      path = "icon-cloud-sun.png";
      break;
    // Cloudy
    case "ovc":
      path = "icon-cloud.png";
      break;
    // Fog
    case "fog":
      path = "icon-fog.png";
      break;
    default:
      path = "icon-cloud.png";
      break;
    }

    return path;
  }

  const path = getIconPath(firstMatchedWeatherType);
  console.log("Provided IconURL: ", iconUrlFromWeatherAPI);
  console.log("Generated IconURL: ", `${assetUrl}/${path}`);

  return `${assetUrl}/${path}`;
};

const isSmallViewport = (handlerInput) => handlerInput.requestEnvelope.context.Viewport.shape === "ROUND";

// For testing
// getWeatherRequest("Stevens_Pass");
// getSnowReportData("Stevens Pass");

// Due to the way module.exports works, when unit testing these module functions that call other module functions
// It actually saves it as an object. So when you go to mock a function it ends up using the copied function instead of the mock
// In order to work around this constraint, we are using this object.
// IMPORTANT: When calling a module function from within the same module, it should be called from exportFunction.moduleName
// The following article explains this further:
// https://medium.com/@DavideRama/mock-spy-exported-functions-within-a-single-module-in-jest-cdf2b61af642
const exportFunctions = {
  // Constants
  NOT_SUPPORTED,
  TERMINAL_ERROR,
  INVALID_DAY,
  NO_DATA_FOR_DAY,
  NO_DATA,
  DB_READ_ERROR,
  getResortSlotIdAndName: getResortSlotIdAndName,
  getSupportedResorts: getSupportedResorts,
  // Weather helpers
  getForecastToday: getForecastToday,
  getForecastWeek: getForecastWeek,
  getForecastWeekDay: getForecastWeekDay,
  getForecastTomorrow: getForecastTomorrow,
  getSnowReportData: getSnowReportData,
  // Exported for unit tests only
  updateDBUniqueResortCounter: updateDBUniqueResortCounter,
  getWeatherRequest: getWeatherRequest,
  addAPLIfSupported: addAPLIfSupported,
  getIconUrl: getIconUrl,
  getSubtitleTextForHandler: getSubtitleTextForHandler,
  isSmallViewport: isSmallViewport
};

module.exports = exportFunctions;