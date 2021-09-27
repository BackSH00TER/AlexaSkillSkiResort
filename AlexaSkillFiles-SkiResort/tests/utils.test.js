const utils = require('../lambda/utils');
const db = require('../lambda/AWS_Helpers');

const mockResortName = "Stevens Pass";
const mockResortSlotID = "Stevens_Pass";

describe('test util functions', () => {
  describe('getResortSlotIdAndName', () => {
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
      expect.assertions(4);
      // Mocking this to make sure the actual DB calls don't happen
      const updateCounterStub = jest.spyOn(utils, 'updateDBUniqueResortCounter').mockImplementation(() => {});
      const { resortSlotID, resortName, synonymValue } = await utils.getResortSlotIdAndName(resortSlot);
      
      expect(updateCounterStub).toHaveBeenCalled();

      expect(resortSlotID).toEqual('mockResortId');
      expect(resortName).toEqual('mockResortName');
      expect(synonymValue).toEqual('mockValue');
    });

    it('returns undefined resortSlotID if there was no match', async () => {
      expect.assertions(4);
      const noResortSlot = {
        ...resortSlot,
        resolutions: {}
      };
      
      // Mocking this to make sure the actual DB calls don't happen
      const updateCounterStub = jest.spyOn(utils, 'updateDBUniqueResortCounter').mockImplementation(() => {});
      const { resortSlotID, resortName, synonymValue } = await utils.getResortSlotIdAndName(noResortSlot);
      
      expect(updateCounterStub).toHaveBeenCalled();

      expect(resortSlotID).toBeUndefined();
      expect(resortName).toBeUndefined();
      expect(synonymValue).toEqual('mockValue');
    });
  
  });

  // describe('getWeatherRequest', () => {
    // TODO: test the actual weatherrequest api
  
  // });
  describe('getForecast functions', () => {
    const mockTempLow = 25;
    const mockTempHigh = 35;
    const mockShortForecast = 'mock short forecast';
    const mockDetailedForecast = 'mock detailed forecast';
    const mockFullForecastStartWithNotIsDaytime = {
      "properties": {
        "periods": [
          {
            "number": 1,
            "name": "Tonight",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 2,
            "name": "Friday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 3,
            "name": "Friday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 4,
            "name": "Saturday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 5,
            "name": "Saturday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 6,
            "name": "Sunday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 7,
            "name": "Sunday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 8,
            "name": "Monday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 9,
            "name": "Monday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 10,
            "name": "Tuesday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 11,
            "name": "Tuesday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 12,
            "name": "Wednesday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 13,
            "name": "Wednesday Night",
            "isDaytime": false,
            "temperature": mockTempLow,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          {
            "number": 14,
            "name": "Thursday",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          }
        ]
      }
    };
    const mockFullForecastStartWithIsDaytime = {
      "properties": {
        "periods": [
          {
            "number": 0,
            "name": "Today",
            "isDaytime": true,
            "temperature": mockTempHigh,
            "shortForecast": mockShortForecast,
            "detailedForecast": mockDetailedForecast
          },
          ...mockFullForecastStartWithNotIsDaytime.properties.periods
        ]
      }
    };
    // Removes the last day, so that we have even number day/night
    mockFullForecastStartWithIsDaytime.properties.periods.pop();

    const dayInfo = {
      tempHigh: mockTempHigh,
      tempLow: mockTempLow,
      shortForecast: mockShortForecast,
      detailedForecast: mockDetailedForecast
    };
    const expectedFullForecastStartWithNotIsDaytime = [
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
    const expectedFullForecastStartWithIsDaytime = [
      {
        day: "Today",
        ...dayInfo
      },
      ...expectedFullForecastStartWithNotIsDaytime
    ];

    describe('getForecastToday', () => {  
      it('returns the forecast for today when it starts with isDaytime false', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastToday({resortID: mockResortSlotID});
  
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toEqual({
          day: "Tonight",
          ...dayInfo,
          tempHigh: utils.NO_DATA
        });
        expect(error).toBeUndefined();
      });

      it('returns the forecast for today when it starts with isDaytime true', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastToday({resortID: mockResortSlotID});
  
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toEqual({
          day: "Today",
          ...dayInfo
        });
        expect(error).toBeUndefined();
      });
  
      it('returns NOT_SUPPORTED, if resortID is not supported by the weather API', async () => {
        expect.assertions(3);
        // Mount Washington currently is a resort that isn't supported
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: undefined, error: utils.NOT_SUPPORTED}));
        const { forecastData, error } = await utils.getForecastToday({resortID: 'Mount_Washington'});
        
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.NOT_SUPPORTED);
      });
  
      it('returns TERMINAL_ERROR, if the Weather API returns a bad response', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: undefined, error: utils.TERMINAL_ERROR}));
        const { forecastData, error } = await utils.getForecastToday({resortID: mockResortSlotID});
  
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.TERMINAL_ERROR);
      });
    });
    
    describe('getForecastWeek', () => {
      describe('returns forecast for the week', () => {
        it('when it starts with isDaytime false', async () => {
          expect.assertions(3);
          const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
          const { forecastData, error } = await utils.getForecastWeek({resortID: mockResortSlotID});
  
          expect(getWeatherRequestStub).toHaveBeenCalled();
          expect(forecastData).toEqual(expectedFullForecastStartWithNotIsDaytime);
          expect(error).toBeUndefined();
        });
  
        it('when it starts with isDaytime true', async () => {
          expect.assertions(3);
          const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithIsDaytime, error: undefined}));
          const { forecastData, error } = await utils.getForecastWeek({resortID: mockResortSlotID});
  
          expect(getWeatherRequestStub).toHaveBeenCalled();
          expect(forecastData).toEqual(expectedFullForecastStartWithIsDaytime);
          expect(error).toBeUndefined();
        });
      });
  
      it('returns NOT_SUPPORTED, if resortID is not supported by the weather API', async () => {
        expect.assertions(3);
        // Mount Washington currently is a resort that isn't supported
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: undefined, error: utils.NOT_SUPPORTED}));
        const { forecastData, error } = await utils.getForecastWeek({resortID: 'Mount_Washington'});
        
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.NOT_SUPPORTED);
      });

      it('returns TERMINAL_ERROR, if the Weather API returns a bad response', async () => {
        expect.assertions(3);
        // Mount Washington currently is a resort that isn't supported
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: undefined, error: utils.TERMINAL_ERROR}));
        const { forecastData, error } = await utils.getForecastWeek({resortID: 'Mount_Washington'});
        
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.TERMINAL_ERROR);
      });
    });

    describe('getForecastWeekDay', () => {
      it('returns the forecast for the specified day', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastWeekDay({resortID: mockResortSlotID, daySlotValue: "Saturday"});

        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toEqual({
          day: "Saturday",
          tempLow: mockTempLow,
          tempHigh: mockTempHigh,
          shortForecast: mockShortForecast,
          detailedForecast: mockDetailedForecast
        });
        expect(error).toBeUndefined();
      });

      // Note: Not testing error codes since this function calls getForecastWeek internally and is already tested above

      it('returns INVALID_DAY if the day value does not match a day of the week', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastWeekDay({resortID: mockResortSlotID, daySlotValue: "NotADay"});
        
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.INVALID_DAY);
      });

      it('returns NO_DATA_FOR_DAY if we dont have data for specific day', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
        // Note in the mock data we won't have data for Thursday
        const { forecastData, error } = await utils.getForecastWeekDay({resortID: mockResortSlotID, daySlotValue: "Thursday"});
        
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.NO_DATA_FOR_DAY);
      });
    });

    describe('getForecastTomorrow', () => {
      it('returns the forecast for tomorrow when it starts with isDaytime false', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithNotIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastTomorrow({resortID: mockResortSlotID});

        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toEqual({
          day: "Friday",
          tempLow: mockTempLow,
          tempHigh: mockTempHigh,
          shortForecast: mockShortForecast,
          detailedForecast: mockDetailedForecast
        });
        expect(error).toBeUndefined();
      });

      it('returns the forecast for tomorrow when it starts with isDaytime true', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: mockFullForecastStartWithIsDaytime, error: undefined}));
        const { forecastData, error } = await utils.getForecastTomorrow({resortID: mockResortSlotID});

        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toEqual({
          day: "Friday",
          tempLow: mockTempLow,
          tempHigh: mockTempHigh,
          shortForecast: mockShortForecast,
          detailedForecast: mockDetailedForecast
        });
        expect(error).toBeUndefined();
      });

      it('returns TERMINAL_ERROR, if the Weather API returns a bad response', async () => {
        expect.assertions(3);
        const getWeatherRequestStub = jest.spyOn(utils, 'getWeatherRequest').mockImplementation(async () => ({data: undefined, error: utils.TERMINAL_ERROR}));
        const { forecastData, error } = await utils.getForecastTomorrow({resortID: mockResortSlotID});
  
        expect(getWeatherRequestStub).toHaveBeenCalled();
        expect(forecastData).toBeUndefined();
        expect(error).toEqual(utils.TERMINAL_ERROR);
      });
    });
  });

  describe('getSnowReportData', () => {
    const mockSnowReportData = {
      Item: {
        resort: 'Stevens Pass',
        seasonSnowFall: '414',
        snowFallTwoDay: '0',
        snowDepthBase: '149',
        snowDepthMidMtn: '190',
        overNightSnowFall: '0',
        snowFallOneDay: '0'
      }
    };

    const expectedResponse = {
      resort: 'Stevens Pass',
      seasonSnowFall: '414',
      snowFallTwoDay: '0',
      snowDepthBase: '149',
      snowDepthMidMtn: '190',
      snowFallOvernight: '0',
      snowFallOneDay: '0'
    };

    it('returns the data', async () => {
      expect.assertions(3);
      const getSnowReportDataStub = jest.spyOn(db, 'getData').mockImplementation(async () => (mockSnowReportData));
      const { snowReportData, error } = await utils.getSnowReportData(mockResortName);
  
      expect(getSnowReportDataStub).toHaveBeenCalled();
      expect(snowReportData).toEqual(expectedResponse);
      expect(error).toBeUndefined();
    });

    it('returns an error if data is missing', async () => {
      expect.assertions(3);
      const getSnowReportDataStub = jest.spyOn(db, 'getData').mockImplementation(async () => {});
      const { snowReportData, error } = await utils.getSnowReportData(mockResortName);
  
      expect(getSnowReportDataStub).toHaveBeenCalled();
      expect(snowReportData).toBeUndefined();
      expect(error).toEqual(utils.DB_READ_ERROR);
    });
  });
});
