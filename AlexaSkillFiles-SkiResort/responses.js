'use strict';

module.exports.welcome = () =>
  'Welcome to Snow Report. You can ask me about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?';

module.exports.helpMessage = () =>
  'You can ask me questions about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?';

module.exports.unknownResort = () =>
  "Sorry, I didn't catch the resort you said. Try asking again with one of the supported resorts.";

module.exports.unknownResortReprompt = () => 
  "I didn't hear the resort you were asking about. Try asking the question again using one of the supported resorts.";

module.exports.weatherServiceNotSupported = () =>
  "I'm sorry, I currently don't support retrieving weather related information for this resort."

module.exports.weatherServiceTerminalError = () =>
  "I'm sorry, there was an error getting the data from the weather service database. If this issue persists, please contact the developer."

module.exports.forecastToday = (resortName, detailedForecast) =>
  `Today's forecast for ${resortName} is: ${detailedForecast}`;

module.exports.forecastWeek = (resortName, forecastDataArray) => {
  let response = `This week's forecast for ${resortName} is: `;

  forecastDataArray.forEach(forecast => {
    response += `${forecast.day} a low of ${forecast.tempLow} with a high of ${forecast.tempHigh}, ${forecast.shortForecast}`
  });

  return response;
}

module.exports.forecastWeekDay = (resortName, day, forecastData) =>
  `At ${resortName} on ${day} there will be a low of ${forecastData.tempLow} with a high of ${forecastData.tempHigh}. The forecast calls for, ${forecastData.detailedForecast}.`

module.exports.dayNotRecognized = () =>
  "Sorry, I didn't catch the day you were looking for. Try asking the question again please."

module.exports.noExtendedForecast = (day) =>
  `Sorry, I don't have the extended forecast for ${day}.`