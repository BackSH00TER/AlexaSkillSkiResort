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

// Generic handler used for the Forecast handlers
const getForecastGenericHandler = async ({
  handlerInput,
  getForecastDataFn,
  getForecastDataFnArgs,
  successResponseFn,
  successResponseFnArgs = {}
}) => {
  const { resortSlotID, resortName, resortDataErrorResponse } = await getResortDataFromSlot(handlerInput);

  if (resortDataErrorResponse) {
    return resortDataErrorResponse;
  }

  const { forecastData, error } = await getForecastDataFn({resortID: resortSlotID, ...getForecastDataFnArgs});
  
  if (error || !forecastData) {
    const errorResponse = getErrorResponse({isDataDefined: !!forecastData, error});
    return handlerInput.responseBuilder
      .speak(errorResponse)
      .reprompt(errorResponse)
      .getResponse();
  }

  return successResponseFn({resortName, forecastData, ...successResponseFnArgs});
};

// Generic handler used for the SnowReport handlers
const getSnowReportGenericHandler = async ({
  handlerInput,
  successResponseFn,
  successResponseFnArgs = {}
}) => {
  const { resortSlotID, resortName, resortDataErrorResponse } = await getResortDataFromSlot(handlerInput);

  if (resortDataErrorResponse) {
    return resortDataErrorResponse;
  }

  const { snowReportData, error } = await getSnowReportData(resortSlotID);
  
  if (error || !snowReportData) {
    const errorResponse = getErrorResponse({isDataDefined: !!snowReportData, error});
    return handlerInput.responseBuilder
      .speak(errorResponse)
      .reprompt(errorResponse)
      .getResponse();
  }

  return successResponseFn({resortName, snowReportData, ...successResponseFnArgs});
};

/**
 * ----------------------------------
 * Default Handlers
 * ----------------------------------
 */

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

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
      return handlerInput.responseBuilder
          .speak(responses.stopMessage())
          .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
      return handlerInput.responseBuilder
          .speak(responses.helpMessage())
          .reprompt(responses.helpMessageReprompt())
          .getResponse();
  }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in the skill
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
      return handlerInput.responseBuilder
          .speak(responses.didNotUnderstand())
          .reprompt(responses.helpMessage())
          .getResponse();
  }
};

/**
 * ----------------------------------
 * Forecast Handlers
 * ----------------------------------
 */

const ForecastTodayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastToday' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'temperatureToday';
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
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastWeekDay' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'temperatureWeekDay';
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
 * ----------------------------------
 * Temperature Handlers
 * ----------------------------------
 */

const TemperatureTonightHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'temperatureTonight';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) =>
      handlerInput.responseBuilder
      .speak(responses.temperatureTonight(resortName, forecastData))
      .getResponse();
    
    const response = await getForecastGenericHandler({handlerInput, getForecastDataFn: getForecastToday, successResponseFn});
    return response;
  }
};

/**
 * ----------------------------------
 * Snow Report Handlers
 * ----------------------------------
 */

const SnowReportDepthHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportDepth';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) =>
      handlerInput.responseBuilder
      .speak(responses.snowReportDepth(resortName, snowReportData))
      .getResponse();
    
    const response = await getSnowReportGenericHandler({handlerInput, successResponseFn});
    return response;
  }
};

const SnowReportSeasonTotalHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportSeasonTotal';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) =>
      handlerInput.responseBuilder
      .speak(responses.snowReportSeasonTotal(resortName, snowReportData))
      .getResponse();
    
    const response = await getSnowReportGenericHandler({handlerInput, successResponseFn});
    return response;
  }
};

const SnowReportOneDayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportOneDay';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) =>
      handlerInput.responseBuilder
      .speak(responses.snowReportOneDay(resortName, snowReportData))
      .getResponse();
    
    const response = await getSnowReportGenericHandler({handlerInput, successResponseFn});
    return response;
  }
};

const SnowReportOvernightHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportOvernight';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) =>
      handlerInput.responseBuilder
      .speak(responses.snowReportOvernight(resortName, snowReportData))
      .getResponse();
    
    const response = await getSnowReportGenericHandler({handlerInput, successResponseFn});
    return response;
  }
};

const SupportedResortsHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'supportedResorts';
  },
  async handle(handlerInput) {
    const supportedResortsArray = await getSupportedResorts();

    return handlerInput.responseBuilder
      .speak(responses.supportedResorts(supportedResortsArray))
      .reprompt(responses.supportedResorts(supportedResortsArray))
      .getResponse();
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
    TemperatureTonightHandler,
    SnowReportDepthHandler,
    SnowReportOneDayHandler,
    SnowReportOvernightHandler,
    SnowReportSeasonTotalHandler,
    SupportedResortsHandler,
    CancelAndStopIntentHandler,
    HelpIntentHandler,
    FallbackIntentHandler
  )
  .lambda();
