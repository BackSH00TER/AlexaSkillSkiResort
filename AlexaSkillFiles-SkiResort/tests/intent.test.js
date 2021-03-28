const context = require('aws-lambda-mock-context');
const skill = require('../index');
const responses = require('../responses');
const utils = require('../utils');

const sessionStartIntent = require('./intent-sample-requests/new-session/session-start.intent');
const forecastTodayIntent = require('./intent-sample-requests/forecastToday/forecast-today.intent');

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
  beforeEach(() => {
    utils.getResortSlotID.mockImplementation(() => {
      return {
        resortSlotID: mockResortSlotID,
        synonymValue: mockResortName
      }
    });

    utils.getResortName.mockImplementation((resortSlotID) => {
      return resortSlotID.split('_').join(' ');
    });

    utils.getForecastToday.mockImplementation(() => {
      return { 
        detailedForecast: mockDetailedForecast, 
        error: undefined
      };
    });
  });

  const mockResortName = "Stevens Pass";
  const mockResortSlotID = "Stevens_Pass";

  describe('LaunchRequest', () => {
    it('Welcomes users and asks what they want to know', async () => {
      expect.assertions(3);
      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(sessionStartIntent);
      expect(outputSpeech).toEqual(sanitise(responses.welcome()));
      expect(repromptSpeech).toEqual(sanitise(responses.helpMessage()));
      expect(endOfSession).toBeFalsy();
    });
  });

  describe.only('forecastToday', () => {
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
      expect.assertions(4);
      
      utils.getResortSlotID.mockImplementation(() => {
        return {
          resortSlotID: undefined,
          synonymValue: mockResortName
        }
      });
      
      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);

      expect(utils.getForecastToday).toHaveBeenCalled();
      expect(outputSpeech).toEqual(responses.unknownResort());
      expect(repromptSpeech).toEqual(responses.unknownResortReprompt());
      expect(endOfSession).toBeFalsy();
    });

    it('returns weatherServiceNotSupported when resort passed in is not supported', async () => {
      expect.assertions(4);

      utils.getForecastToday.mockImplementationOnce(() => {
        return { 
          error: utils.NOT_SUPPORTED
        };
      });

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);

      expect(utils.getForecastToday).toHaveBeenCalled();
      expect(outputSpeech).toEqual(responses.weatherServiceNotSupported());
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeFalsy();
    });

    it('returns weatherServiceTerminalError when TERMINAL_ERROR received', async () => {
      expect.assertions(4);

      utils.getForecastToday.mockImplementationOnce(() => {
        return { 
          error: utils.TERMINAL_ERROR
        };
      });

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);

      expect(utils.getForecastToday).toHaveBeenCalled();
      expect(outputSpeech).toEqual(responses.weatherServiceTerminalError());
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeFalsy();
    });

    it('returns weatherServiceTerminalError when detailedForecast is undefined', async () => {
      expect.assertions(4);

      utils.getForecastToday.mockImplementationOnce(() => {
        return { 
          detailedForecast: undefined,
          error: undefined
        };
      });

      const {outputSpeech, endOfSession, repromptSpeech} = await runIntent(forecastTodayIntent);

      expect(utils.getForecastToday).toHaveBeenCalled();
      expect(outputSpeech).toEqual(responses.weatherServiceTerminalError());
      expect(repromptSpeech).toEqual(NO_REMPROMPT);
      expect(endOfSession).toBeFalsy();
    });
  });
});