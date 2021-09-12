'use strict';
const Alexa = require('alexa-sdk');
const responses = require('./responses');
const {
  NOT_SUPPORTED,
  TERMINAL_ERROR,
  INVALID_DAY,
  NO_DATA_FOR_DAY,
  DB_READ_ERROR,
  getResortSlotIdAndName,
  getForecastToday,
  getForecastWeek,
  getForecastWeekDay,
  getForecastTomorrow,
  getSnowReportData,
  getSupportedResorts
} = require('./utils');

const { AlexaAppId } = require('./secrets/credentials');

//=========================================================================================================================================
// Handlers
//=========================================================================================================================================
exports.handler = function (event, context) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = AlexaAppId;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

/**
 * Returns the response for the correct error
 * @param {object} isDataDefined - boolean
 * @param {object} error - string
 * @returns {string} - error response to return based on error passed in
 */
const getErrorResponse = ({
  isDataDefined,
  error,
  daySlotValue
}) => {
  let response;
  if (!isDataDefined) {
    response = responses.weatherServiceTerminalError();
  }

  switch (error) {
    case NOT_SUPPORTED:
      response = responses.weatherServiceNotSupported();
      break;
    case INVALID_DAY:
      response = responses.dayNotRecognized();
      break;
    case NO_DATA_FOR_DAY:
      response = responses.noExtendedForecast(daySlotValue);
      break;
    case TERMINAL_ERROR:
      response = responses.weatherServiceTerminalError();
      break;
    case DB_READ_ERROR:
      response = responses.snowReportTerminalError();
      break;
    default:
      response = responses.weatherServiceTerminalError();
      break;
  };

  return response;
};

const handlers = {
  'LaunchRequest': function () {
    this.emit(':ask', responses.welcome(), responses.helpMessage());
  },
  'forecastToday': async function ()  {
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { forecastData, error } = await getForecastToday(resortSlotID);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error});
      this.emit(':ask', response);
    }

    // Return detailed forecast for today
    this.emit(':tell', responses.forecastToday(resortName, forecastData));
  },
  'forecastWeek': async function () {
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { forecastDataArray, error } = await getForecastWeek(resortSlotID);

    if (error || (!forecastDataArray || !forecastDataArray.length)) {
      const response = getErrorResponse({isDataDefined: !!forecastDataArray, error});
      this.emit(':ask', response);
    }

    // Return forecast for the week
    this.emit(':tell', responses.forecastWeek(resortName, forecastDataArray));
  },
  'forecastWeekDay': async function () {
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);
    const daySlotValue = this.event.request.intent.slots.Day.value;

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }
    
    const { forecastData, error } = await getForecastWeekDay(resortSlotID, daySlotValue);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error, daySlotValue});
      this.emit(':ask', response);
    }

    // Return forecast for the week day
    this.emit(':tell', responses.forecastWeekDay(resortName, daySlotValue, forecastData));
  },
  'forecastTomorrow': async function () {
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { forecastData, error } = await getForecastTomorrow(resortSlotID);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error});
      this.emit(':ask', response);
    }

    // Return detailed forecast for tomorrow
    this.emit(':tell', responses.forecastTomorrow(resortName, forecastData));
  },
  'temperatureToday': async function () {
    // TODO: Note this is the same as getForecastToday just a different response, maybe refactor?
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { forecastData, error } = await getForecastToday(resortSlotID);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error});
      this.emit(':ask', response);
    }

    // Return temperature for today
    this.emit(':tell', responses.temperatureToday(resortName, forecastData));
  },
  'temperatureTonight': async function () {
    // TODO: Note this is the same as getForecastToday just a different response, maybe refactor?
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { forecastData, error } = await getForecastToday(resortSlotID);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error});
      this.emit(':ask', response);
    }

    // Return temperature for today
    this.emit(':tell', responses.temperatureTonight(resortName, forecastData));
  },
  'temperatureWeekDay': async function () {
    // TODO: Note this is the same as getForecastWeekDay just a different response, maybe refactor?
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);
    const daySlotValue = this.event.request.intent.slots.Day.value;

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }
    
    const { forecastData, error } = await getForecastWeekDay(resortSlotID, daySlotValue);

    if (error || !forecastData) {
      const response = getErrorResponse({isDataDefined: !!forecastData, error, daySlotValue});
      this.emit(':ask', response);
    }

    // Return forecast for the week day
    this.emit(':tell', responses.temperatureWeekDay(resortName, daySlotValue, forecastData));
  },
  'snowReportDepth': async function () {
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { snowReportData, error } = await getSnowReportData(resortSlotID);

    if (error || !snowReportData) {
      const response = getErrorResponse({isDataDefined: !!snowReportData, error});
      this.emit(':ask', response);
    }

    this.emit(':tell', responses.snowReportDepth(resortName, snowReportData));
  },
  'snowReportSeasonTotal': async function () {
    // TODO: Note this is exactly the same as snowReportDepth just with a different response
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { snowReportData, error } = await getSnowReportData(resortSlotID);

    if (error || !snowReportData) {
      const response = getErrorResponse({isDataDefined: !!snowReportData, error});
      this.emit(':ask', response);
    }

    this.emit(':tell', responses.snowReportSeasonTotal(resortName, snowReportData));
  },
  'snowReportOneDay': async function () {
    // TODO: Note this is exactly the same as snowReportDepth just with a different response
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { snowReportData, error } = await getSnowReportData(resortSlotID);

    if (error || !snowReportData) {
      const response = getErrorResponse({isDataDefined: !!snowReportData, error});
      this.emit(':ask', response);
    }

    this.emit(':tell', responses.snowReportOneDay(resortName, snowReportData));
  },
  'snowReportOvernight': async function () {
    // TODO: Note this is exactly the same as snowReportDepth just with a different response
    const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

    if (!resortSlotID || !resortName) {
      console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
      this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
    }

    const { snowReportData, error } = await getSnowReportData(resortSlotID);

    if (error || !snowReportData) {
      const response = getErrorResponse({isDataDefined: !!snowReportData, error});
      this.emit(':ask', response);
    }

    this.emit(':tell', responses.snowReportOvernight(resortName, snowReportData));
  },
  'supportedResorts': async function () {
    const supportedResortsArray = await getSupportedResorts();
    
    this.emit(':ask', responses.supportedResorts(supportedResortsArray));
  },
  'AMAZON.HelpIntent': function () {
    this.emit(':ask', responses.helpMessage(), responses.helpMessageReprompt());
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', responses.stopMessage());
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', responses.stopMessage());
  },
  'Unhandled': function () {
      this.emit(':ask', responses.didNotUnderstand(), responses.helpMessage());
  },
  'CatchAll': function () {
      this.emit(':ask', responses.didNotUnderstand(), responses.helpMessage());
  }
};
