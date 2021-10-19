'use strict';
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
  getSupportedResorts,
  addAPLIfSupported,
  getIconUrl,
  getSubtitleTextForHandler,
  isSmallViewport
} = require('./utils');

// Read in the APL documents for use in handlers
const {
  snowReportForecastDocument,
  snowReportForecastData,
  snowReportData,
  snowReportWeekForecastDocument,
  snowReportWeekForecastData: snowReportWeekForecastDataFn,
  snowReportForecastSmallDocument,
  snowReportForecastSmallData: snowReportForecastSmallDataFn,
  snowReportHeadlineDocument,
  snowReportHeadlineData,
  snowReportSupportedResortsDocument,
  snowReportSupportedResortsData
} = require('./renderDocuments');

//=========================================================================================================================================
// Handlers
//=========================================================================================================================================

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
    resortDataErrorResponse,
    synonymValue
  };
};

// Generic handler used for the Forecast handlers
const getForecastGenericHandler = async ({
  handlerInput,
  handlerName,
  getForecastDataFn,
  getForecastDataFnArgs,
  successResponseFn,
  successResponseFnArgs = {},
  aplDocument,
  aplDocumentDataFn
}) => {
  try {
    console.log('Invoking getForecastGenericHandler for handler: ', handlerName);
    const { resortSlotID, resortName, resortDataErrorResponse, synonymValue } = await getResortDataFromSlot(handlerInput);
    const subtitleText = getSubtitleTextForHandler({handlerName, data: getForecastDataFnArgs});

    if (resortDataErrorResponse) {
      console.error('Resort data error');
      addAPLIfSupported({
        handlerInput,
        token: "ForecastError",
        document: snowReportForecastDocument,
        data: snowReportForecastDataFn({
          subtitle: subtitleText,
          resortName,
          showAsError: true,
          errorResponse: responses.unknownResort(synonymValue)
        })
      });
      return resortDataErrorResponse;
    }

    const { forecastData, error } = await getForecastDataFn({resortID: resortSlotID, ...getForecastDataFnArgs});
    
    if (error || !forecastData) {
      console.log('Error getting forecast data. Error: ', error, 'forecastData: ', forecastData);
      const errorResponse = getErrorResponse({isDataDefined: !!forecastData, error});
      
      addAPLIfSupported({
        handlerInput,
        token: "ForecastError",
        document: snowReportForecastDocument,
        data: snowReportForecastDataFn({
          subtitle: subtitleText,
          resortName,
          showAsError: true,
          errorResponse
        })
      });

      return handlerInput.responseBuilder
        .speak(errorResponse)
        .reprompt(errorResponse)
        .getResponse();
    }

    addAPLIfSupported({
      handlerInput,
      token: `Forecast-${handlerName}-${resortName}`,
      document: aplDocument,
      data: aplDocumentDataFn({
        subtitle: subtitleText,
        resortName,
        forecastData
      })
    });

    return successResponseFn({resortName, forecastData, ...successResponseFnArgs});
  } catch (err) {
    console.error('ERROR: Something went wrong. ', err);
    const errorResponse = responses.weatherServiceTerminalError();
      
    addAPLIfSupported({
      handlerInput,
      token: "ForecastError",
      document: snowReportForecastDocument,
      data: snowReportForecastDataFn({
        subtitle: "Error",
        resortName,
        showAsError: true,
        errorResponse
      })
    });

    return handlerInput.responseBuilder
      .speak(errorResponse)
      .reprompt(errorResponse)
      .getResponse();
  }
};

// Generic handler used for the SnowReport handlers
const getSnowReportGenericHandler = async ({
  handlerInput,
  handlerName,
  successResponseFn,
  successResponseFnArgs = {},
  aplDocument,
  aplDocumentDataFn
}) => {
  const { resortSlotID, resortName, resortDataErrorResponse } = await getResortDataFromSlot(handlerInput);
  const subtitleText = getSubtitleTextForHandler({handlerName});

  if (resortDataErrorResponse) {
    addAPLIfSupported({
      handlerInput,
      token: "ForecastError",
      document: snowReportForecastDocument,
      data: snowReportForecastDataFn({
        subtitle: subtitleText,
        resortName,
        showAsError: true,
        errorResponse: responses.unknownResort(synonymValue)
      })
    });
    return resortDataErrorResponse;
  }

  const { snowReportData, error } = await getSnowReportData(resortSlotID);
  
  if (error || !snowReportData) {
    const errorResponse = getErrorResponse({isDataDefined: !!snowReportData, error});
    
    addAPLIfSupported({
      handlerInput,
      token: "ForecastError",
      document: snowReportForecastDocument,
      data: snowReportForecastDataFn({
        subtitle: subtitleText,
        resortName,
        showAsError: true,
        errorResponse
      })
    });

    return handlerInput.responseBuilder
      .speak(errorResponse)
      .reprompt(errorResponse)
      .getResponse();
  }

  addAPLIfSupported({
    handlerInput,
    token: `Forecast-${handlerName}-${resortName}`,
    document: aplDocument,
    data: aplDocumentDataFn({
      subtitle: subtitleText,
      resortName,
      iconUrl: "https://snowreportskill-assets.s3.amazonaws.com/icon-snow.png",
      primaryText: `
        ${snowReportData.seasonSnowFall ==    'FAIL' ? '' : `Total: ${snowReportData.seasonSnowFall}" <br />`} 
        ${snowReportData.snowFallOvernight == 'FAIL' ? '' : `Overnight: ${snowReportData.snowFallOvernight}" <br />`} 
        ${snowReportData.snowFallTwoDay ==    'FAIL' ? '' : `Last 2 days: ${snowReportData.snowFallTwoDay}" <br />`} 
        ${snowReportData.snowDepthBase ==     'FAIL' ? '' : `Base: ${snowReportData.snowDepthBase}" <br />`} 
        ${snowReportData.snowDepthMidMtn ==   'FAIL' ? '' : `Mid: ${snowReportData.snowDepthMidMtn}" <br />`}
      `,
      bodyText: ''
    })
  });

  return successResponseFn({resortName, snowReportData, ...successResponseFnArgs});
};

/**
 * Function returns the data for the snowReportForecast APL document
 * This function is also used to handle the snowReportForecast errors
 */
const snowReportForecastDataFn = ({subtitle, resortName, forecastData, showAsError, errorResponse}) => {
  console.log('snowReportForecastDataFn', {subtitle, resortName, showAsError, forecastData, errorResponse})
  const iconUrl = showAsError ?
    "https://snowreportskill-assets.s3.amazonaws.com/icon-cloud-slash.png" :
    getIconUrl({iconUrlFromWeatherAPI: forecastData.iconUrl, showAsError});
  
  return snowReportForecastData({
    subtitle,
    resortName,
    iconUrl,
    tempHigh: showAsError ? "N/A" : forecastData.tempHigh,
    tempLow: showAsError ? "N/A" : forecastData.tempLow,
    forecastDetail: showAsError ? errorResponse : forecastData.detailedForecast,
    showAsError
  });
};

// Sets the response onto sessionAttributes.lastSpeechOutput (to be used by RepeatIntentHandler)
const setSessionAttributeLastSpeechOutput = (handlerInput, response) => {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes.lastSpeechOutput = response;
  return;
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
    addAPLIfSupported({
      handlerInput,
      token: "SnowReportLaunch",
      document: snowReportHeadlineDocument,
      data: snowReportHeadlineData
    });

    const outputSpeech = responses.welcome();
    setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(responses.helpMessage())
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && (
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(responses.stopMessage())
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const outputSpeech = responses.helpMessage();
    setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(responses.helpMessageReprompt())
      .getResponse();
  }
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.responseBuilder
      .speak(sessionAttributes.lastSpeechOutput)
      .reprompt(sessionAttributes.lastSpeechOutput)
      .getResponse();
  }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in the skill
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    console.log('!!! FallbackIntent handler called')
    const outputSpeech = responses.didNotUnderstand();
    setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

    return handlerInput.responseBuilder
      .speak(outputSpeech)
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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && (
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastToday' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'temperatureToday'
    );
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) => {
      const outputSpeech = responses.forecastToday(resortName, forecastData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
        .speak(outputSpeech)
        .withShouldEndSession(false)
        .getResponse();
      };
    
    const response = await getForecastGenericHandler({
      handlerInput,
      handlerName: "forecastToday",
      getForecastDataFn: getForecastToday,
      successResponseFn,
      aplDocument: isSmallViewport(handlerInput) ? snowReportForecastSmallDocument : snowReportForecastDocument,
      aplDocumentDataFn: isSmallViewport(handlerInput) ? snowReportForecastSmallDataFn :  snowReportForecastDataFn
    });

    return response;
  }
};

const ForecastTomorrowHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastTomorrow';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData}) => {
      const outputSpeech = responses.forecastTomorrow(resortName, forecastData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const response = await getForecastGenericHandler({
      handlerInput,
      handlerName: "forecastTomorrow",
      getForecastDataFn: getForecastTomorrow,
      successResponseFn,
      aplDocument: isSmallViewport(handlerInput) ? snowReportForecastSmallDocument : snowReportForecastDocument,
      aplDocumentDataFn: isSmallViewport(handlerInput) ? snowReportForecastSmallDataFn :  snowReportForecastDataFn
    });

    return response;
  }
};

const ForecastWeekDayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && (
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'forecastWeekDay' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'temperatureWeekDay'
    );
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, forecastData, daySlotValue}) => {
      const outputSpeech = responses.forecastWeekDay(resortName, daySlotValue, forecastData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const daySlotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, "Day");

    const response = await getForecastGenericHandler({
      handlerInput,
      handlerName: "forecastWeekDay",
      getForecastDataFn: getForecastWeekDay,
      getForecastDataFnArgs: {daySlotValue},
      successResponseFn,
      successResponseFnArgs: {daySlotValue},
      aplDocument: isSmallViewport(handlerInput) ? snowReportForecastSmallDocument : snowReportForecastDocument,
      aplDocumentDataFn: isSmallViewport(handlerInput) ? snowReportForecastSmallDataFn :  snowReportForecastDataFn
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
    const successResponseFn = ({resortName, forecastData}) => {
      const outputSpeech = responses.forecastWeek(resortName, forecastData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };

    const response = await getForecastGenericHandler({
      handlerInput,
      handlerName: "forecastWeek",
      getForecastDataFn: getForecastWeek,
      successResponseFn,
      aplDocument: isSmallViewport(handlerInput) ? snowReportForecastSmallDocument : snowReportWeekForecastDocument,
      aplDocumentDataFn: isSmallViewport(handlerInput) ? snowReportForecastSmallDataFn :  snowReportWeekForecastDataFn
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
    const successResponseFn = ({resortName, forecastData}) => {
      const outputSpeech = responses.temperatureTonight(resortName, forecastData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
        .speak(outputSpeech)
        .withShouldEndSession(false)
        .getResponse();
    };
    
    const response = await getForecastGenericHandler({
      handlerInput,
      handlerName: "temperatureTonight",
      getForecastDataFn: getForecastToday,
      successResponseFn,
      aplDocument: isSmallViewport(handlerInput) ? snowReportForecastSmallDocument : snowReportForecastDocument,
      aplDocumentDataFn: isSmallViewport(handlerInput) ? snowReportForecastSmallDataFn :  snowReportForecastDataFn
    });

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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && (
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportDepth' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportSeasonTotal'
    );
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) => {
      const outputSpeech = responses.snowReportDepth(resortName, snowReportData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const response = await getSnowReportGenericHandler({
      handlerInput,
      handlerName: "snowReportDepth",
      successResponseFn,
      aplDocument: snowReportForecastDocument,
      aplDocumentDataFn: snowReportData
    });

    return response;
  }
};

const SnowReportSeasonTotalHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportSeasonTotal';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) => {
      const outputSpeech = responses.snowReportSeasonTotal(resortName, snowReportData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const response = await getSnowReportGenericHandler({
      handlerInput,
      handlerName: "snowReportSeasonTotal",
      successResponseFn,
      aplDocument: snowReportForecastDocument,
      aplDocumentDataFn: snowReportData
    });

    return response;
  }
};

const SnowReportOneDayHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportOneDay';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) => {
      const outputSpeech = responses.snowReportOneDay(resortName, snowReportData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const response = await getSnowReportGenericHandler({
      handlerInput,
      handlerName: "snowReportOneDay",
      successResponseFn,
      aplDocument: snowReportForecastDocument,
      aplDocumentDataFn: snowReportData
    });

    return response;
  }
};

const SnowReportOvernightHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'snowReportOvernight';
  },
  async handle(handlerInput) {
    const successResponseFn = ({resortName, snowReportData}) => {
      const outputSpeech = responses.snowReportOvernight(resortName, snowReportData) + '. ' + responses.wantToKnowAnythingElse();
      setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

      return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .getResponse();
    };
    
    const response = await getSnowReportGenericHandler({
      handlerInput,
      handlerName: "snowReportOvernight",
      successResponseFn,
      aplDocument: snowReportForecastDocument,
      aplDocumentDataFn: snowReportData
    });

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

    addAPLIfSupported({
      handlerInput,
      token: `SupportedResortsList`,
      document: snowReportSupportedResortsDocument,
      data: snowReportSupportedResortsData(supportedResortsArray)
    });

    const outputSpeech = responses.supportedResorts(supportedResortsArray);
    setSessionAttributeLastSpeechOutput(handlerInput, outputSpeech);

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
      .getResponse();
  }
};

// This is used to log errors for debugging
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('Session Ended with reason:', handlerInput.requestEnvelope.request.reason);

    if (handlerInput.requestEnvelope.request.error) {
      console.log('ERROR: ', JSON.stringify(handlerInput.requestEnvelope.request.error));
    }
    
    return handlerInput.responseBuilder.getResponse();
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
    // SnowReportSeasonTotalHandler, // Disabling for now since SeasonTotal is not supported on OnTheSnow
    SupportedResortsHandler,
    CancelAndStopIntentHandler,
    RepeatIntentHandler,
    HelpIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler
  )
  .lambda();
