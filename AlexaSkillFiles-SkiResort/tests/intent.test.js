const context = require('aws-lambda-mock-context');
const skill = require('../index');
const responses = require('../responses');
const utils = require('../utils');

const sessionStartIntent = require('./intent-sample-requests/new-session/session-start.intent');
const forecastTodayIntent = require('./intent-sample-requests/forecastToday/forecast-today.intent');
const forecastWeekIntent = require('./intent-sample-requests/forecast-week.intent');
const forecastWeekDayIntent = require('./intent-sample-requests/forecast-weekday.intent');
const forecastTomorrowIntent = require('./intent-sample-requests/forecast-tomorrow.intent');

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
       console.log('Response', obj);
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
        detailedForecast: mockDetailedForecast, 
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

  describe('forecastToday', () => {
    it('tells the user the forecast for the day', async () => {
      expect.assertions(4);
      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);
      const expectedOutputSpeech = responses.forecastToday(mockResortName, mockDetailedForecast);
      
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
          detailedForecast: undefined,
          error: utils.NOT_SUPPORTED
        };
      });

      await testWeatherServiceUnsupportedResortError(forecastTodayIntent, utils.getForecastToday);
    });

    it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
      utils.getForecastToday.mockImplementationOnce(() => {
        return {
          detailedForecast: undefined,
          error: utils.TERMINAL_ERROR
        };
      });

      await testWeatherServiceTerminalError(forecastTodayIntent, utils.getForecastToday);
    });

    it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
      utils.getForecastToday.mockImplementationOnce(() => {
        return { 
          detailedForecast: undefined,
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