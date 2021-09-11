'use strict';

const { NO_DATA } = require('./utils');

module.exports.welcome = () =>
  'Welcome to Snow Report. You can ask me about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?';

module.exports.helpMessage = () =>
  'You can ask me questions about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?';

module.exports.unknownResort = (synonymValue) =>
  `I was unable to match the resort, ${synonymValue}, with one of the supported resorts. Please try asking again with a supported resort.`;

module.exports.unknownResortReprompt = () => 
  "Sorry, I don't recognize the resort you are asking about. Try asking the question again using one of the supported resorts.";

module.exports.weatherServiceNotSupported = () =>
  "I'm sorry, I currently don't support retrieving weather related information for this resort."

module.exports.weatherServiceTerminalError = () =>
  "I'm sorry, there was an error getting the data from the weather service database. If this issue persists, please contact the developer."

module.exports.snowReportTerminalError = () =>
  "I'm sorry, there was an error getting the snow report data from the database. If this issue persists, please contact the developer."

module.exports.forecastToday = (resortName, forecastData) =>
  `Today's forecast for ${resortName} is: ${forecastData.detailedForecast}`;

module.exports.forecastWeek = (resortName, forecastDataArray) => {
  let response = `This week's forecast for ${resortName} is: `;

  forecastDataArray.forEach(forecast => {
    response += ` ${forecast.day} a low of ${forecast.tempLow} with a high of ${forecast.tempHigh}, ${forecast.shortForecast}.`
  });

  return response;
}

module.exports.forecastWeekDay = (resortName, day, forecastData) =>
  `At ${resortName} on ${day} there will be a low of ${forecastData.tempLow} with a high of ${forecastData.tempHigh}. The forecast calls for, ${forecastData.detailedForecast}.`

module.exports.forecastTomorrow = (resortName, forecastData) =>
  `Tomorrow at ${resortName} there will be a low of ${forecastData.tempLow} with a high of ${forecastData.tempHigh}. The forecast calls for, ${forecastData.detailedForecast}.`

module.exports.temperatureToday = (resortName, forecastData) => {
  const temp = forecastData.tempHigh == NO_DATA ? forecastData.tempLow : forecastData.tempHigh;
  return `The temperature at ${resortName} is ${temp} degrees, with a forecast of ${forecastData.shortForecast}`;
}

module.exports.temperatureTonight = (resortName, forecastData) =>
  `Tonights temperature at ${resortName} will be ${forecastData.tempLow} degrees, with a forecast of ${forecastData.shortForecast}`;

module.exports.temperatureWeekDay = (resortName, day, forecastData) =>
  `The temperature at ${resortName} on ${day} will be a low of ${forecastData.tempLow} with a high of ${forecastData.tempHigh}. The forecast calls for, ${forecastData.detailedForecast}.`

module.exports.dayNotRecognized = () =>
  "Sorry, I didn't catch the day you were looking for. Try asking the question again please."

module.exports.noExtendedForecast = (day) =>
  `Sorry, I don't have the extended forecast for ${day}.`

module.exports.snowReportDepth = (resortName, snowReportData) => {
  // TODO: Revist and try to make this less wordy. Also consider if this should return anything forecast related?? - yes
  // TODO: Try seeing what alexa does by default when ask for snowreport
  return `In the last two days ${resortName} has received ${snowReportData.snowFallTwoDay} inches of new snow. The base depth is currently at ${snowReportData.snowDepthBase} inches and mid mountain is at ${snowReportData.snowDepthMidMtn} inches. The season total is ${snowReportData.seasonSnowFall}.`
};