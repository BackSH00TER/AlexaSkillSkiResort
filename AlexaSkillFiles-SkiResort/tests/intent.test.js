const context = require('aws-lambda-mock-context');
const skill = require('../lambda/index');
const responses = require('../lambda/responses');
const utils = require('../lambda/utils');

const sessionStartIntent = require('./intent-sample-requests/new-session/session-start.intent');
const forecastTodayIntent = require('./intent-sample-requests/forecastToday/forecast-today.intent');
const forecastWeekIntent = require('./intent-sample-requests/forecast-week.intent');
const forecastWeekDayIntent = require('./intent-sample-requests/forecast-weekday.intent');
const forecastTomorrowIntent = require('./intent-sample-requests/forecast-tomorrow.intent');
const temperatureTodayIntent = require('./intent-sample-requests/temperature-today.intent');
const temperatureTonightIntent = require('./intent-sample-requests/temperature-tonight.intent');
const temperatureWeekDayIntent = require('./intent-sample-requests/temperature-weekday.intent');
const snowReportDepthIntent = require('./intent-sample-requests/snow-report-depth.intent');
const snowReportSeasonTotalIntent = require('./intent-sample-requests/snow-report-season-total.intent');
const snowReportOvernightIntent = require('./intent-sample-requests/snow-report-overnight.intent');
const snowReportOneDayIntent = require('./intent-sample-requests/snow-report-one-day.intent');
const supportedResortsIntent = require('./intent-sample-requests/supported-resorts.intent');
const cancelIntent = require('./intent-sample-requests/cancel.intent');
const catchAllIntent = require('./intent-sample-requests/catchall.intent');
const helpIntent = require('./intent-sample-requests/help.intent');
const stopIntent = require('./intent-sample-requests/stop.intent');

const NO_REMPROMPT = 'no_reprompt';
const sanitise = text => text.replace(/\n/g, '');

const getOutputSpeech = ({ outputSpeech: { ssml } }) =>
  sanitise(ssml).match(/<speak>(.*)<\/speak>/i)[1].trim();

const getAttribute = ({ sessionAttributes }, attr) => sessionAttributes[attr]; //sessionAttributes might not exist on my end

const runIntent = intent => new Promise(res => {
  const ctx = context();
  skill.handler(intent, ctx);

  ctx
    .Promise
    .then(obj => {
      //  console.log('Response', obj);
      res({
        endOfSession: obj.response.shouldEndSession,
        outputSpeech: getOutputSpeech(obj.response),
        repromptSpeech: obj.response.reprompt ? getOutputSpeech(obj.response.reprompt) : NO_REMPROMPT
      });
    })
    .catch(err => {
      console.log('Run intent error:', err);
      throw new Error(err);
    });
});

// Sets all the utils to jest.fn()
jest.mock('../utils.js');

const mockDetailedForecast = "A detailed forecast";

describe('intents', () => {
  const mockResortName = "Stevens Pass";
  const mockResortSlotID = "Stevens_Pass";

  const mockTempLow = 25;
  const mockTempHigh = 35;
  const mockShortForecast = 'mock short forecast';
  const mockDetailedForecast = 'mock detailed forecast';
  const dayInfo = {
    tempHigh: mockTempHigh,
    tempLow: mockTempLow,
    shortForecast: mockShortForecast,
    detailedForecast: mockDetailedForecast
  };
  const mockFullForecast = [
    {
      day: "Friday",
      ...dayInfo
    },
    {
      day: "Saturday",
      ...dayInfo
    },
    {
      day: "Sunday",
      ...dayInfo
    },
    {
      day: "Monday",
      ...dayInfo
    },
    {
      day: "Tuesday",
      ...dayInfo
    },
    {
      day: "Wednesday",
      ...dayInfo
    }
  ];
  const mockOneDayForecast = {
    day: "Friday",
    ...dayInfo
  };
  const mockSnowReport = {
    resort: 'Stevens Pass',
    snowDepthBase: '149',
    snowDepthMidMtn: '190',
    seasonSnowFall: '414',
    snowFallOvernight: '1',
    snowFallOneDay: '2',
    snowFallTwoDay: '3',
  };

  const mockResorts = ["resort 1", "resort 2", "resort 3"];

  const testResortIdUndefined = async (intent) => {
    expect.assertions(4);

    utils.getResortSlotIdAndName.mockImplementation(() => {
      return {
        resortSlotID: undefined,
        resortName: mockResortName,
        synonymValue: mockResortName
      }
    });

    const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(intent);

    expect(utils.getResortSlotIdAndName).toHaveBeenCalled();
    expect(outputSpeech).toEqual(responses.unknownResort(mockResortName));
    expect(repromptSpeech).toEqual(responses.unknownResortReprompt());
    expect(endOfSession).toBeFalsy();
  };

  const testResortNameUndefined = async (intent) => {
    expect.assertions(4);
      
    utils.getResortSlotIdAndName.mockImplementation(() => {
      return {
        resortSlotID: mockResortSlotID,
        resortName: undefined,
        synonymValue: mockResortName
      }
    });
    
    const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(intent);

    expect(utils.getResortSlotIdAndName).toHaveBeenCalled();
    expect(outputSpeech).toEqual(responses.unknownResort(mockResortName));
    expect(repromptSpeech).toEqual(responses.unknownResortReprompt());
    expect(endOfSession).toBeFalsy();
  };

  const testWeatherServiceTerminalError = async (intent, utilFunction) => {
    expect.assertions(4);
    const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(intent);

    expect(utilFunction).toHaveBeenCalled();
    expect(outputSpeech).toEqual(responses.weatherServiceTerminalError());
    expect(repromptSpeech).toEqual(NO_REMPROMPT);
    expect(endOfSession).toBeFalsy();
  };

  const testWeatherServiceUnsupportedResortError = async (intent, utilFunction) => {
    expect.assertions(4);
    const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(intent);

    expect(utilFunction).toHaveBeenCalled();
    expect(outputSpeech).toEqual(responses.weatherServiceNotSupported());
    expect(repromptSpeech).toEqual(NO_REMPROMPT);
    expect(endOfSession).toBeFalsy();
  };

  const testSnowReportTerminalError = async (intent) => {
    expect.assertions(4);

    utils.getSnowReportData.mockImplementationOnce(() => {
      return {
        snowReportData: undefined,
        error: utils.DB_READ_ERROR
      }
    });

    const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(intent);

    expect(utils.getSnowReportData).toHaveBeenCalled();
    expect(outputSpeech).toEqual(responses.snowReportTerminalError());
    expect(repromptSpeech).toEqual(NO_REMPROMPT);
    expect(endOfSession).toBeFalsy();
  };


  beforeEach(() => {
    utils.getResortSlotIdAndName.mockImplementation(() => {
      return {
        resortSlotID: mockResortSlotID,
        resortName: mockResortName,
        synonymValue: mockResortName
      }
    });

    utils.getForecastToday.mockImplementation(() => {
      return { 
        forecastData: mockOneDayForecast, 
        error: undefined
      };
    });

    utils.getForecastWeek.mockImplementation(() => {
      return { 
        forecastDataArray: mockFullForecast, 
        error: undefined
      };
    });

    utils.getForecastWeekDay.mockImplementation(() => {
      return { 
        forecastData: mockOneDayForecast, 
        error: undefined
      };
    });

    utils.getForecastTomorrow.mockImplementation(() => {
      return { 
        forecastData: mockOneDayForecast, 
        error: undefined
      };
    });

    utils.getSnowReportData.mockImplementation(() => {
      return {
        snowReportData: mockSnowReport,
        error: undefined
      }
    });

    utils.getSupportedResorts.mockImplementation(() => {
      return mockResorts
    });
  });

  describe('LaunchRequest', () => {
    it('Welcomes users and asks what they want to know', async () => {
      expect.assertions(3);
      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(sessionStartIntent);
      expect(outputSpeech).toEqual(sanitise(responses.welcome()));
      expect(repromptSpeech).toEqual(sanitise(responses.helpMessage()));
      expect(endOfSession).toBeFalsy();
    });
  });

  describe('forecast intents', () => {
    describe('forecastToday', () => {
      it('tells the user the forecast for the day', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);
        const expectedOutputSpeech = responses.forecastToday(mockResortName, mockOneDayForecast);
        
        expect(utils.getForecastToday).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
  
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(forecastTodayIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(forecastTodayIntent);
      });
  
      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);
  
        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.NOT_SUPPORTED
          };
        });
  
        await testWeatherServiceUnsupportedResortError(forecastTodayIntent, utils.getForecastToday);
      });
  
      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.TERMINAL_ERROR
          };
        });
  
        await testWeatherServiceTerminalError(forecastTodayIntent, utils.getForecastToday);
      });
  
      it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return { 
            forecastData: undefined,
            error: undefined
          };
        });
  
        await testWeatherServiceTerminalError(forecastTodayIntent, utils.getForecastToday);
      });
    });
  
    describe('forecastWeek', () => {
      it('returns the forecast for the week', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastWeekIntent);
        const expectedOutputSpeech = responses.forecastWeek(mockResortName, mockFullForecast);
        
        expect(utils.getForecastWeek).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
  
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(forecastWeekIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(forecastWeekIntent);
      });
  
      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);
  
        utils.getForecastWeek.mockImplementationOnce(() => {
          return {
            forecastDataArray: undefined,
            error: utils.NOT_SUPPORTED
          };
        });
  
        await testWeatherServiceUnsupportedResortError(forecastWeekIntent, utils.getForecastWeek);
      });
  
      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastWeek.mockImplementationOnce(() => {
          return {
            forecastDataArray: undefined,
            error: utils.TERMINAL_ERROR
          };
        });
  
        await testWeatherServiceTerminalError(forecastWeekIntent, utils.getForecastWeek);
      });
  
      it('returns weatherServiceTerminalError when forecastDataArray is empty', async () => {
        utils.getForecastWeek.mockImplementationOnce(() => {
          return {
            forecastDataArray: [],
            error: undefined
          };
        });
  
        await testWeatherServiceTerminalError(forecastWeekIntent, utils.getForecastWeek);
      });
  
      it('returns weatherServiceTerminalError when forecastDataArray is undefined', async () => {
        utils.getForecastWeek.mockImplementationOnce(() => {
          return {
            forecastDataArray: undefined,
            error: undefined
          };
        });
  
        await testWeatherServiceTerminalError(forecastWeekIntent, utils.getForecastWeek);
      });
    });
  
    describe('forecastWeekDay', () => {
      it('returns the forecast for a specific day of the week', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastWeekDayIntent);
        const expectedOutputSpeech = responses.forecastWeekDay(mockResortName, "friday", mockOneDayForecast);
        
        expect(utils.getForecastWeekDay).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
  
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(forecastWeekDayIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(forecastWeekDayIntent);
      });
  
      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);
  
        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.NOT_SUPPORTED
          };
        });
  
        await testWeatherServiceUnsupportedResortError(forecastWeekDayIntent, utils.getForecastWeekDay);
      });
  
      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.TERMINAL_ERROR
          };
        });
  
        await testWeatherServiceTerminalError(forecastWeekDayIntent, utils.getForecastWeekDay);
      });
  
      it('returns weatherServiceTerminalError when forecastData is undefined', async () => {
        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: undefined
          };
        });
  
        await testWeatherServiceTerminalError(forecastWeekDayIntent, utils.getForecastWeekDay);
      });
    });
  
    describe('forecastTomorrow', () => {
      it('tells the user tomorrows forecast', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTomorrowIntent);
        const expectedOutputSpeech = responses.forecastTomorrow(mockResortName, mockOneDayForecast);
        
        expect(utils.getForecastTomorrow).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
  
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(forecastTomorrowIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(forecastTomorrowIntent);
      });
  
      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);
  
        utils.getForecastTomorrow.mockImplementationOnce(() => {
          return {
            detailedForecast: undefined,
            error: utils.NOT_SUPPORTED
          };
        });
  
        await testWeatherServiceUnsupportedResortError(forecastTomorrowIntent, utils.getForecastTomorrow);
      });
  
      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastTomorrow.mockImplementationOnce(() => {
          return {
            detailedForecast: undefined,
            error: utils.TERMINAL_ERROR
          };
        });
  
        await testWeatherServiceTerminalError(forecastTomorrowIntent, utils.getForecastTomorrow);
      });
  
      it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
        utils.getForecastTomorrow.mockImplementationOnce(() => {
          return { 
            detailedForecast: undefined,
            error: undefined
          };
        });
  
        await testWeatherServiceTerminalError(forecastTomorrowIntent, utils.getForecastTomorrow);
      });
    });
  });
  
  describe('temperature intents', () => {
    // Basically a copy of forecastToday tests
    describe('temperatureToday', () => {
      it('tells the user the temperature for the day', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(temperatureTodayIntent);
        const expectedOutputSpeech = responses.temperatureToday(mockResortName, mockOneDayForecast);
        
        expect(utils.getForecastToday).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('tells the user the temperature for the day if there is no high temp', async () => {
        expect.assertions(4);
        const mockForecast = {
          ...mockOneDayForecast,
          tempHigh: utils.NO_DATA
        };

        utils.getForecastToday.mockImplementationOnce(() => {
          return { 
            forecastData: mockForecast, 
            error: undefined
          };
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(temperatureTodayIntent);
        const expectedOutputSpeech = responses.temperatureToday(mockResortName, mockForecast);
        
        expect(utils.getForecastToday).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(temperatureTodayIntent);
      });

      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(temperatureTodayIntent);
      });

      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);

        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.NOT_SUPPORTED
          };
        });

        await testWeatherServiceUnsupportedResortError(temperatureTodayIntent, utils.getForecastToday);
      });

      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.TERMINAL_ERROR
          };
        });

        await testWeatherServiceTerminalError(temperatureTodayIntent, utils.getForecastToday);
      });

      it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return { 
            forecastData: undefined,
            error: undefined
          };
        });

        await testWeatherServiceTerminalError(temperatureTodayIntent, utils.getForecastToday);
      });
    });

    // Basically a copy of forecastToday tests
    describe('temperatureTonight', () => {
      it('tells the user the temperature for tonight', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(temperatureTonightIntent);
        const expectedOutputSpeech = responses.temperatureTonight(mockResortName, mockOneDayForecast);
        
        expect(utils.getForecastToday).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(temperatureTonightIntent);
      });

      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(temperatureTonightIntent);
      });

      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);

        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.NOT_SUPPORTED
          };
        });

        await testWeatherServiceUnsupportedResortError(temperatureTonightIntent, utils.getForecastToday);
      });

      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.TERMINAL_ERROR
          };
        });

        await testWeatherServiceTerminalError(temperatureTonightIntent, utils.getForecastToday);
      });

      it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
        utils.getForecastToday.mockImplementationOnce(() => {
          return { 
            forecastData: undefined,
            error: undefined
          };
        });

        await testWeatherServiceTerminalError(temperatureTonightIntent, utils.getForecastToday);
      });
    });

    // Basically a copy of forecastWeekDay tests
    describe('temperatureWeekDay', () => {
      it('returns the forecast for a specific day of the week', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(temperatureWeekDayIntent);
        const expectedOutputSpeech = responses.temperatureWeekDay(mockResortName, "friday", mockOneDayForecast);
        
        expect(utils.getForecastWeekDay).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(temperatureWeekDayIntent);
      });

      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(temperatureWeekDayIntent);
      });

      it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
        expect.assertions(4);

        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.NOT_SUPPORTED
          };
        });

        await testWeatherServiceUnsupportedResortError(temperatureWeekDayIntent, utils.getForecastWeekDay);
      });

      it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: utils.TERMINAL_ERROR
          };
        });

        await testWeatherServiceTerminalError(temperatureWeekDayIntent, utils.getForecastWeekDay);
      });

      it('returns weatherServiceTerminalError when forecastData is undefined', async () => {
        utils.getForecastWeekDay.mockImplementationOnce(() => {
          return {
            forecastData: undefined,
            error: undefined
          };
        });

        await testWeatherServiceTerminalError(temperatureWeekDayIntent, utils.getForecastWeekDay);
      });
    });
  });

  describe('snow report intents', () => {
    describe('snowReportDepth', () => {
      it('returns the snow report for the resort', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReport);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns error message when all data points are "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallTwoDay: "FAIL",
          snowDepthBase: "FAIL",
          snowDepthMidMtn: "FAIL",
          seasonSnowFall: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when snowFallTwoDay is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallTwoDay: "FAIL",
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when snowDepthBase is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowDepthBase: "FAIL",
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when snowDepthMidMtn is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowDepthMidMtn: "FAIL",
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when seasonSnowFall is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          seasonSnowFall: "FAIL",
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportDepthIntent);
        const expectedOutputSpeech = responses.snowReportDepth(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
    
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(snowReportDepthIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(snowReportDepthIntent);
      });

      it('returns snowReportTerminalError when it fails to read from the DB', async () => {
        await testSnowReportTerminalError(snowReportDepthIntent);
      });
    });

    describe('snowReportSeasonTotal', () => {
      it('returns the snow report for the resort', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportSeasonTotalIntent);
        const expectedOutputSpeech = responses.snowReportSeasonTotal(mockResortName, mockSnowReport);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns error message when seasonTotal is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
            seasonSnowFall: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportSeasonTotalIntent);
        const expectedOutputSpeech = responses.snowReportSeasonTotal(mockResortName, mockSnowReportWithFailure);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
    
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(snowReportSeasonTotalIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(snowReportSeasonTotalIntent);
      });

      it('returns snowReportTerminalError when it fails to read from the DB', async () => {
        await testSnowReportTerminalError(snowReportSeasonTotalIntent);
      });
    });

    describe('snowReportOvernight', () => {
      it('returns the snow report for the resort', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOvernightIntent);
        const expectedOutputSpeech = responses.snowReportOvernight(mockResortName, mockSnowReport);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns error message when snowFallOvernight is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallOvernight: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOvernightIntent);
        const expectedOutputSpeech = responses.snowReportOvernight(mockResortName, mockSnowReportWithFailure);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
    
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(snowReportOvernightIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(snowReportOvernightIntent);
      });

      it('returns snowReportTerminalError when it fails to read from the DB', async () => {
        await testSnowReportTerminalError(snowReportOvernightIntent);
      });
    });

    describe('snowReportOneDay', () => {
      it('returns the snow report for the resort', async () => {
        expect.assertions(4);
        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOneDayIntent);
        const expectedOutputSpeech = responses.snowReportOneDay(mockResortName, mockSnowReport);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when snowFallOneDay is defined and snowFallTwoDay is "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallTwoDay: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOneDayIntent);
        const expectedOutputSpeech = responses.snowReportOneDay(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns partial message when snowFallOneDay is "FAIL" and snowFallTwoDay is defined', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallOneDay: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOneDayIntent);
        const expectedOutputSpeech = responses.snowReportOneDay(mockResortName, mockSnowReportWithFailure);

        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });

      it('returns error message when snowFallOneDay and snowFallTwoDay are "FAIL"', async () => {
        expect.assertions(4);

        const mockSnowReportWithFailure = {
          ...mockSnowReport,
          snowFallOneDay: "FAIL",
          snowFallTwoDay: "FAIL"
        };
        utils.getSnowReportData.mockImplementationOnce(() => {
          return {
            snowReportData: mockSnowReportWithFailure,
            error: undefined
          }
        });

        const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(snowReportOneDayIntent);
        const expectedOutputSpeech = responses.snowReportOneDay(mockResortName, mockSnowReportWithFailure);
        
        expect(utils.getSnowReportData).toHaveBeenCalled();
        expect(outputSpeech).toEqual(expectedOutputSpeech);
        expect(repromptSpeech).toEqual(NO_REMPROMPT);
        expect(endOfSession).toBeTruthy();
      });
    
      it('returns unknownResort when resortId is undefined', async () => {
        await testResortIdUndefined(snowReportOneDayIntent);
      });
  
      it('returns unknownResort when resortName is undefined', async () => {
        await testResortNameUndefined(snowReportOneDayIntent);
      });

      it('returns snowReportTerminalError when it fails to read from the DB', async () => {
        await testSnowReportTerminalError(snowReportOneDayIntent);
      });
    });
  });

  describe('supportedResorts', () => {
    it('returns the list of supported resorts', async () => {
      expect.assertions(4);

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(supportedResortsIntent);
      const expectedOutputSpeech = responses.supportedResorts(mockResorts);

      expect(utils.getSupportedResorts).toHaveBeenCalled();
      expect(outputSpeech).toEqual(expectedOutputSpeech);
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeFalsy();
    });
  });

  describe('basic intents', () => {
    it('returns the help intent', async () => {
      expect.assertions(3);

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(helpIntent);
      const expectedOutputSpeech = responses.helpMessage();
      const expectedRepromptSpeech = responses.helpMessageReprompt();

      expect(outputSpeech).toEqual(expectedOutputSpeech);
      expect(repromptSpeech).toEqual(expectedRepromptSpeech);
      expect(endOfSession).toBeFalsy();
    });

    it('returns the cancel intent', async () => {
      expect.assertions(3);

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(cancelIntent);
      const expectedOutputSpeech = responses.stopMessage();

      expect(outputSpeech).toEqual(expectedOutputSpeech);
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeTruthy();
    });

    it('returns the stop intent', async () => {
      expect.assertions(3);

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(stopIntent);
      const expectedOutputSpeech = responses.stopMessage();

      expect(outputSpeech).toEqual(expectedOutputSpeech);
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeTruthy();
    });

    it('returns the catchall intent', async () => {
      expect.assertions(3);

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(catchAllIntent);
      const expectedOutputSpeech = responses.didNotUnderstand();
      const expectedRepromptSpeech = responses.helpMessage();

      expect(outputSpeech).toEqual(expectedOutputSpeech);
      expect(repromptSpeech).toEqual(expectedRepromptSpeech);
      expect(endOfSession).toBeFalsy();
    });
  });
});