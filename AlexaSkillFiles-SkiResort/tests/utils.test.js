const utils = require('../utils');

const mockResortName = "Stevens Pass";
const mockResortSlotID = "Stevens_Pass";

describe('test util functions', () => {
  describe('getResortSlotID', () => {
    const resortSlot = {
      value: 'mockValue',
      resolutions: {
        resolutionsPerAuthority: [{
          status: {
            code: "ER_SUCCESS_MATCH"
          },
          values: [{
            value: {
              name: 'mockResortName',
              id: 'mockResortId'
            }
          }]
        }]
      }
    };
  
    it('returns the resortSlotID and synonym value', async () => {
      expect.assertions(3);
      // Mocking this to make sure the actual DB calls don't happen
      const updateCounterStub = jest.spyOn(utils, 'updateDBUniqueResortCounter').mockImplementation(() => {});
      const { resortSlotID, synonymValue } = await utils.getResortSlotID(resortSlot);
      
      expect(updateCounterStub).toHaveBeenCalled();

      expect(resortSlotID).toEqual('mockResortId');
      expect(synonymValue).toEqual('mockValue');
    });

    it('returns undefined resortSlotID if there was no match', async () => {
      expect.assertions(3);
      const noResortSlot = {
        ...resortSlot,
        resolutions: {}
      };
      
      // Mocking this to make sure the actual DB calls don't happen
      const updateCounterStub = jest.spyOn(utils, 'updateDBUniqueResortCounter').mockImplementation(() => {});
      const { resortSlotID, synonymValue } = await utils.getResortSlotID(noResortSlot);
      
      expect(updateCounterStub).toHaveBeenCalled();

      expect(resortSlotID).toBeUndefined();
      expect(synonymValue).toEqual('mockValue');
    });
  
  });
  
  // describe('getResortName', () => {
  
  // });

  // describe('getWeatherRequest', () => {
  
  // });
  
  describe('getForecastToday', () => {
    const mockDetailedForecast = "Mock detailed forecast.";
    const mockForecastResponse = {
      "properties": {
        "periods": [
          {
            "number": 1,
            "name": "Tonight",
            "isDaytime": false,
            "temperature": 32,
            "shortForecast": "Mostly Cloudy",
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 2,
            "name": "Sunday",
            "isDaytime": true,
            "temperature": 37,
            "shortForecast": "Heavy Snow",
            "detailedForecast": mockDetailedForecast
          }
        ]
      }
    };

    it('returns NOT_SUPPORTED, if resortID is not supported by the weather API', async () => {
      expect.assertions(1);
      // Mount Washington currently is a resort that isn't supported
      const { error } = await utils.getForecastToday('Mount_Washington');
      expect(error).toEqual(utils.NOT_SUPPORTED);
    });

    it('returns TERMINAL_ERROR, if the Weather API returns a bad response', async () => {
      expect.assertions(2);
      const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => utils.TERMINAL_ERROR);
      const { error } = await utils.getForecastToday(mockResortSlotID);

      expect(getWeatherRequestStub).toHaveBeenCalled();
      expect(error).toEqual(utils.TERMINAL_ERROR);
    });

    it.only('returns the forecast for today', async () => {
      expect.assertions(3);
      const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => JSON.stringify(mockForecastResponse));
      const { detailedForecast, error } = await utils.getForecastToday(mockResortSlotID);

      expect(getWeatherRequestStub).toHaveBeenCalled();
      expect(detailedForecast).toEqual(mockDetailedForecast);
      expect(error).toBeUndefined();
    });
  });
  
  // describe('getForecastWeek', () => {
  
  // });
  
  // describe('getForecastWeekDay', () => {
  
  // });
});
