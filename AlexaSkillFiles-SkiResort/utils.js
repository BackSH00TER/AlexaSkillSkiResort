const db = require('./AWS_Helpers');
const fetch = require('node-fetch');

const NOT_SUPPORTED = "NOT_SUPPORTED";
const TERMINAL_ERROR = "TERMINAL_ERROR";
const INVALID_DAY = "INVALID_DAY";
const NO_DATA_FOR_DAY = "NO_DATA_FOR_DAY";

/**
 * Removes underscores from the resortSlotID
 * @param {string} resortSlotID 
 * @returns {string} Resort name from the slotID w/ underscores removed
 */
const getResortName = (resortSlotID) => {
  return resortSlotID.split('_').join(' ');
}
/**
 * Returns the slotID and value for the resort in the IntentRequest
 * @param {object} resortsSlot - from the IntentRequest (ex: 'this.event.request.intent.slots.Resort')
 * @returns {object} {resortSlotID, synonymValue}
 */
const getResortSlotID = async (resortSlot) => {
  console.log('Attempting to get resortSlotID...');
  let synonymValue = resortSlot.value;
  let resortSlotID;

  // Attempt to get resortSlotID
  if (
    resortSlot.resolutions &&
    resortSlot.resolutions.resolutionsPerAuthority[0] &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status.code &&
    resortSlot.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_MATCH"
  ) {
    resortSlotID = resortSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;
  }

  await updateDBUniqueResortCounter(resortSlotID, synonymValue);

  console.log(`getResortSlotID returning: resortSlotID: ${resortSlotID} synonymValue: ${synonymValue}`);
  return {
    resortSlotID,
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
    ReturnValues:"UPDATED_NEW"
  }

  console.log('Updating DB Resort Counter...');
  await db.updateResortCount(params);
}

// Weather API related code
// These are the gridpoints used for the weather API
const resortWeatherGridpoints = {
  Stevens_Pass: 'SEW/164,66',
  Snoqualmie_Pass: 'SEW/151,53',
  Crystal_Mountain: 'SEW/144,30',
  Mount_Baker: 'SEW/156,122',
  Mission_Ridge: 'OTX/42,89',
  Mount_Hood_Meadows: 'PQR/143,88',
  Mount_Hood_Skibowl: 'PQR/139,87',
  Timberline_Lodge: 'PQR/135,95',
  Mount_Bachelor: 'PDT/22,39',
  Schweitzer: 'OTX/171,120',
  Sun_Valley: 'PIH/38,93',
  Mammoth_Mountain: 'REV/56,16',
  Big_Bear_Mountain: 'SGX/76,78',
  Breckenridge: 'BOU/24,52',
  Alta: 'SLC/107,166',
  Brighton: 'SLC/109,166',
  Snowbird: 'SLC/107,165',
  Solitude: 'SLC/109,167',
  Deer_Valley: 'SLC/113,167',
  Park_City: 'SLC/112,168',
  Sundance: 'SLC/108,157',
  Powder_Mountain: 'SLC/107,202',
  Snowbasin: 'SLC/103,195',
  Brian_Head_Resort: 'SLC/48,41',
  Eagle_Point: 'SLC/68,67',
  Beaver_Mountain: 'SLC/118,228',
  Mount_Washington: 'NOT_SUPPORTED'
};

/**
 * Makes a network request to the WeatherAPI to get the forecast for the given resort
 * @param {string} resortID 
 * @returns JSON formatted object of the weather forecast for the week.
 * If there are any errors, it returns a TERMINAL_ERROR
 */
const getWeatherRequest = async (resortID) => {
  console.log(`Requesting weather for ${resortId}`);
  const gridpoint = resortWeatherGridpoints[resortID];
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
    return jsonData;
  } catch (error) {
    console.log(`Error fetching Weather info for ${resortID}: ${error}`);
    return TERMINAL_ERROR;
  }
};

/**
 * Gets the weather for today
 * @param {string} resortID 
 * @returns {object} {detailedForecast?: string, error?: string}
 * On success, returns the detailedForecast for today
 * On error, returns NOT_SUPPORTED if the resort is not supported by the WeatherAPI.
 * Returns TERMINAL_ERROR if there was an error getting the weather.
 */
const getForecastToday = async (resortID) => {
  // End early if resortID is not supported
  if (resortWeatherGridpoints[resortID] === NOT_SUPPORTED) {
    return { error: NOT_SUPPORTED };
  }

  const response = await getWeatherRequest(resortID);

  if (response === TERMINAL_ERROR) {
    return { error: TERMINAL_ERROR };
  }

  const forecast = JSON.parse(response);

  return { detailedForecast: forecast.properties.periods[0].detailedForecast };
};

// TODO: pull the first few lines into a helper function
  // helper function checks not+uspported, callst he cactual request, checks terminal error, and also tries to parse the response (this could go wrong potentially result in terminal errro)
  // then it can return an {isValid, error}, if error return, else if isvalid do teh rest
  // should help to reduce copy paste code between each one

/**
 * Gets the forecast for the week
 * @param {string} resortID 
 * @returns {object} Object containing an array of forecast data or an error
 * {
 *   forecastDataArray?: [{day, tempHigh, tempLow, shortForecast, detailedForecast}],
 *   error?: string
 * }
 * On error, returns NOT_SUPPORTED if the resort is not supported by the WeatherAPI.
 * Returns TERMINAL_ERROR if there was an error getting the weather.
 */
const getForecastWeek = async (resortID) => {
  // End early if resortID is not supported
  if (resortWeatherGridpoints[resortID] === NOT_SUPPORTED) {
    return { error: NOT_SUPPORTED };
  }

  const response = await getWeatherRequest(resortID);
  
  if (response === TERMINAL_ERROR) {
    return { error: TERMINAL_ERROR };
  }
  const forecast = JSON.parse(response);
  const forecastPeriods = forecast.properties.periods;

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
      detailedForecast: forecastPeriods[i].detailedForecast
    });
  }

  return { forecastDataArray: forecastData, error: null };
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
 * On error, returns NOT_SUPPORTED if the resort is not supported by the WeatherAPI.
 * Returns TERMINAL_ERROR if there was an error getting the weather.
 * Returns INVALID_DAY if the day passed in does not match a day of the week
 */
const getForecastWeekDay = (resortID, day) => {
  const { forecastDataArray, error } = getForecastWeek(resortID);

  if (error) { 
    return { error };
  }

  // Make sure user said a valid day and that we have the data for that day
  // Ex: If they ask for Friday and today is Friday, we only have up to next Thursday
  // Ex: In some cases a holiday name could replace the name of the day in the field
  if(!isValidDayOfTheWeek(day)) {
    return { error: INVALID_DAY };
  }

  const forecastDataForSpecificDay = forecastDataArray.find(data => data.day.toLowerCase() === day.toLowerCase())
  const noDataForDayError = !forecastDataForSpecificDay ? NO_DATA_FOR_DAY : null;

  return {
    forecastData: forecastDataForSpecificDay,
    error: noDataForDayError
  };
}

/**
 * Checks that the a valid day of the week is being used
 * @param {string} day 
 * @returns true/false
 */
const isValidDayOfTheWeek =  (day) => {
  const daysOfTheWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return daysOfTheWeek.indexOf(day.toLowerCase() > -1);
}

// For testing
// getWeatherRequest("Stevens_Pass");


module.exports = {
  NOT_SUPPORTED,
  getResortSlotID: getResortSlotID,
  getResortName: getResortName,
  getForecastToday: getForecastToday,
  getForecastWeek: getForecastWeek,
  getForecastWeekDay: getForecastWeekDay
};