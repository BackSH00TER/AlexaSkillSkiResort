'use strict';
// const Alexa = require('alexa-sdk');
// TODO: Might need to add the backwards compatible library for now until its all moved over?
const Alexa = require('ask-sdk');
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

// TOOD: Move this to responses and then import?
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

/**
 * Returns the resort data from the "Resort" slot
 * resortDataErrorResponse - is only defined if the resortName or Id were undefined
 * @returns {object} {resortSlotID, resortName, synonymValue, resortDataErrorResponse}
 */
const getResortDataFromSlot = async (handlerInput) => {
  const slot = Alexa.getSlot(handlerInput.requestEnvelope, "Resort");
  
  const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(slot);

  let resortDataErrorResponse;
  if (!resortSlotID || !resortName) {
    console.warn(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);

    resortDataErrorResponse = handlerInput.responseBuilder
      .speak(responses.unknownResort(synonymValue))
      .reprompt(responses.unknownResortReprompt())
      .getResponse();
  }

  return {
    resortSlotID,
    resortName,
    resortDataErrorResponse
  };
};

const getForecastGenericHandler = async ({
  handlerInput,
  getForecastDataFn,
  getForecastDataFnArgs,
  successResponseFn,
  successResponseFnArgs = {}
}) => {
  const {resortSlotID, resortName, resortDataErrorResponse} = await getResortDataFromSlot(handlerInput);

  if (resortDataErrorResponse) {
    return resortDataErrorResponse;
  }

  const {forecastData, error} = await getForecastDataFn({resortID: resortSlotID, ...getForecastDataFnArgs});
  
  if (error || !forecastData) {
    const errorResponse = getErrorResponse({isDataDefined: !!forecastData, error});
    return handlerInput.responseBuilder
      .speak(errorResponse)
      .reprompt(errorResponse)
      .getResponse();
  }

  return successResponseFn({resortName, forecastData, ...successResponseFnArgs});
};


// V2 - Handlers

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(responses.welcome())
      .reprompt(responses.helpMessage())
      .getResponse();
  }
};

const ForecastTodayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastToday';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) =>
      handlerInput.responseBuilder
      .speak(responses.forecastToday(resortName, forecastData))
      .getResponse();
    
    const response = await getForecastGenericHandler({handlerInput, getForecastDataFn: getForecastToday, successResponseFn});
    return response;
  }
};

const ForecastTomorrowHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastTomorrow';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) =>
      handlerInput.responseBuilder
      .speak(responses.forecastTomorrow(resortName, forecastData))
      .getResponse();
    
    const response = await getForecastGenericHandler({handlerInput, getForecastDataFn: getForecastTomorrow, successResponseFn});
    return response;
  }
};

const ForecastWeekDayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastWeekDay';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData, daySlotValue}) =>
      handlerInput.responseBuilder
      .speak(responses.forecastWeekDay(resortName, daySlotValue, forecastData))
      .getResponse();
    
    const daySlotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, "Day");

    const response = await getForecastGenericHandler({
      handlerInput,
      getForecastDataFn: getForecastWeekDay,
      getForecastDataFnArgs: {daySlotValue},
      successResponseFn,
      successResponseFnArgs: {daySlotValue}
    });
    return response;
  }
};

const ForecastWeekHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastWeek';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) =>
      handlerInput.responseBuilder
      .speak(responses.forecastWeek(resortName, forecastData))
      .getResponse();

    const response = await getForecastGenericHandler({
      handlerInput,
      getForecastDataFn: getForecastWeek,
      successResponseFn,
    });
    return response;
  }
};

/**
 * This handler acts as the entry point for the skill, routing all request and response
 * payloads to the handlers. Make sure any new handlers or interceptors are included below.
 * The order matters - they're processed top to bottom!
 */
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ForecastTodayHandler,
    ForecastTomorrowHandler,
    ForecastWeekHandler,
    ForecastWeekDayHandler,
  )
  .lambda();


// const handlers = {
//   'LaunchRequest': function () {
//     this.emit(':ask', responses.welcome(), responses.helpMessage());
//   },
//   'forecastToday': async function ()  {
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { forecastData, error } = await getForecastToday(resortSlotID);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error});
//       this.emit(':ask', response);
//     }

//     // Return detailed forecast for today
//     this.emit(':tell', responses.forecastToday(resortName, forecastData));
//   },
//   'forecastWeek': async function () {
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { forecastDataArray, error } = await getForecastWeek(resortSlotID);

//     if (error || (!forecastDataArray || !forecastDataArray.length)) {
//       const response = getErrorResponse({isDataDefined: !!forecastDataArray, error});
//       this.emit(':ask', response);
//     }

//     // Return forecast for the week
//     this.emit(':tell', responses.forecastWeek(resortName, forecastDataArray));
//   },
//   'forecastWeekDay': async function () {
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);
//     const daySlotValue = this.event.request.intent.slots.Day.value;

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }
    
//     const { forecastData, error } = await getForecastWeekDay(resortSlotID, daySlotValue);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error, daySlotValue});
//       this.emit(':ask', response);
//     }

//     // Return forecast for the week day
//     this.emit(':tell', responses.forecastWeekDay(resortName, daySlotValue, forecastData));
//   },
//   'forecastTomorrow': async function () {
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { forecastData, error } = await getForecastTomorrow(resortSlotID);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error});
//       this.emit(':ask', response);
//     }

//     // Return detailed forecast for tomorrow
//     this.emit(':tell', responses.forecastTomorrow(resortName, forecastData));
//   },
//   'temperatureToday': async function () {
//     // TODO: Note this is the same as getForecastToday just a different response, maybe refactor?
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { forecastData, error } = await getForecastToday(resortSlotID);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error});
//       this.emit(':ask', response);
//     }

//     // Return temperature for today
//     this.emit(':tell', responses.temperatureToday(resortName, forecastData));
//   },
//   'temperatureTonight': async function () {
//     // TODO: Note this is the same as getForecastToday just a different response, maybe refactor?
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { forecastData, error } = await getForecastToday(resortSlotID);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error});
//       this.emit(':ask', response);
//     }

//     // Return temperature for today
//     this.emit(':tell', responses.temperatureTonight(resortName, forecastData));
//   },
//   'temperatureWeekDay': async function () {
//     // TODO: Note this is the same as getForecastWeekDay just a different response, maybe refactor?
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);
//     const daySlotValue = this.event.request.intent.slots.Day.value;

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }
    
//     const { forecastData, error } = await getForecastWeekDay(resortSlotID, daySlotValue);

//     if (error || !forecastData) {
//       const response = getErrorResponse({isDataDefined: !!forecastData, error, daySlotValue});
//       this.emit(':ask', response);
//     }

//     // Return forecast for the week day
//     this.emit(':tell', responses.temperatureWeekDay(resortName, daySlotValue, forecastData));
//   },
//   'snowReportDepth': async function () {
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { snowReportData, error } = await getSnowReportData(resortSlotID);

//     if (error || !snowReportData) {
//       const response = getErrorResponse({isDataDefined: !!snowReportData, error});
//       this.emit(':ask', response);
//     }

//     this.emit(':tell', responses.snowReportDepth(resortName, snowReportData));
//   },
//   'snowReportSeasonTotal': async function () {
//     // TODO: Note this is exactly the same as snowReportDepth just with a different response
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { snowReportData, error } = await getSnowReportData(resortSlotID);

//     if (error || !snowReportData) {
//       const response = getErrorResponse({isDataDefined: !!snowReportData, error});
//       this.emit(':ask', response);
//     }

//     this.emit(':tell', responses.snowReportSeasonTotal(resortName, snowReportData));
//   },
//   'snowReportOneDay': async function () {
//     // TODO: Note this is exactly the same as snowReportDepth just with a different response
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { snowReportData, error } = await getSnowReportData(resortSlotID);

//     if (error || !snowReportData) {
//       const response = getErrorResponse({isDataDefined: !!snowReportData, error});
//       this.emit(':ask', response);
//     }

//     this.emit(':tell', responses.snowReportOneDay(resortName, snowReportData));
//   },
//   'snowReportOvernight': async function () {
//     // TODO: Note this is exactly the same as snowReportDepth just with a different response
//     const {resortSlotID, resortName, synonymValue} = await getResortSlotIdAndName(this.event.request.intent.slots.Resort);

//     if (!resortSlotID || !resortName) {
//       console.log(`Error: Missing resortSlotID. Synonym value used: ${synonymValue}`);
//       this.emit(':ask', responses.unknownResort(synonymValue), responses.unknownResortReprompt());
//     }

//     const { snowReportData, error } = await getSnowReportData(resortSlotID);

//     if (error || !snowReportData) {
//       const response = getErrorResponse({isDataDefined: !!snowReportData, error});
//       this.emit(':ask', response);
//     }

//     this.emit(':tell', responses.snowReportOvernight(resortName, snowReportData));
//   },
//   'supportedResorts': async function () {
//     const supportedResortsArray = await getSupportedResorts();
    
//     this.emit(':ask', responses.supportedResorts(supportedResortsArray));
//   },
//   'AMAZON.HelpIntent': function () {
//     this.emit(':ask', responses.helpMessage(), responses.helpMessageReprompt());
//   },
//   'AMAZON.CancelIntent': function () {
//       this.emit(':tell', responses.stopMessage());
//   },
//   'AMAZON.StopIntent': function () {
//       this.emit(':tell', responses.stopMessage());
//   },
//   'Unhandled': function () {
//       this.emit(':ask', responses.didNotUnderstand(), responses.helpMessage());
//   },
//   'CatchAll': function () {
//       this.emit(':ask', responses.didNotUnderstand(), responses.helpMessage());
//   }
// };
