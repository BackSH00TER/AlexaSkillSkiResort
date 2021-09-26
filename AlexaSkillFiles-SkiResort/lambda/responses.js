'use strict';

const { NO_DATA } = require('./utils');

module.exports.welcome = () =>
  'Welcome to Snow Report. What would you like to know?';

module.exports.helpMessage = () =>
  'You can ask me questions about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?';

module.exports.helpMessageReprompt = () =>
  'What would you like to know? You can ask me about the forecast, temperature, or snow report for your favorite ski resort.';

module.exports.stopMessage = () =>
  'Cya later, have fun on the slopes!';

module.exports.didNotUnderstand = () =>
  "I'm sorry, I didn't understand that. Try asking your question again.";

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
  `The temperature at ${resortName} on ${day} will be a low of ${forecastData.tempLow} with a high of ${forecastData.tempHigh}. The forecast calls for, ${forecastData.detailedForecast}.`

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
  if (
    snowReportData.snowFallTwoDay === 'FAIL' &&
    snowReportData.snowDepthBase === 'FAIL' &&
    snowReportData.snowDepthMidMtn === 'FAIL' &&
    snowReportData.seasonSnowFall === 'FAIL'
  ) {
    return dataErrorMessage(resortName, "snow report");
  }

  let msg = '';
  if (snowReportData.snowFallTwoDay !== 'FAIL') {
    msg = `In the last two days ${resortName} has received ${snowReportData.snowFallTwoDay} ${inchOrInches(snowReportData.snowFallTwoDay)} of new snow. `;
  }

  if (snowReportData.snowDepthBase !== 'FAIL') {
    msg += `The base depth is currently at ${snowReportData.snowDepthBase} inches, `;
  }

  if (snowReportData.snowDepthMidMtn !== 'FAIL') {
    msg += `mid mountain is at ${snowReportData.snowDepthMidMtn} inches.`;
  }

  if (snowReportData.seasonSnowFall !== 'FAIL') {
    msg += ` The season total is ${snowReportData.seasonSnowFall} inches.`;
  }

  return msg;
};

module.exports.snowReportSeasonTotal = (resortName, snowReportData) => {
  if (snowReportData.seasonSnowFall == 'FAIL') {
    return dataErrorMessage(resortName, "season total snow fall");
  } else {
    return `The season total snow fall at ${resortName} is ${snowReportData.seasonSnowFall} inches.`;
  }
};

module.exports.snowReportOneDay = (resortName, snowReportData) => {
  if (snowReportData.snowFallOneDay == 'FAIL' && snowReportData.snowFallTwoDay == 'FAIL') {
    return dataErrorMessage(resortName, "yesterdays");
  } else if (snowReportData.snowFallTwoDay == 'FAIL') {
    return `${resortName} got ${snowReportData.snowFallOneDay} ${inchOrInches(snowReportData.snowFallOneDay)} of snow yesterday.`;
  } else if (snowReportData.snowFallOneDay == 'FAIL') {
    return `${resortName} got ${snowReportData.snowFallTwoDay} ${inchOrInches(snowReportData.snowFallTwoDay)} of snow in the last two days.`;
  } else {
    return `${resortName} got ${snowReportData.snowFallOneDay} ${inchOrInches(snowReportData.snowFallOneDay)} of snow yesterday and a total of ${snowReportData.snowFallTwoDay} ${inchOrInches(snowReportData.snowFallTwoDay)} in the last two days`;
  }
};

module.exports.snowReportOvernight = (resortName, snowReportData) => {
  if (snowReportData.snowFallOvernight == 'FAIL') {
    return dataErrorMessage(resortName, "over night snow fall");
  } else {
    return `${resortName} got ${snowReportData.snowFallOvernight} ${inchOrInches(snowReportData.snowFallOvernight)} of snow over night.`;
  }
};

module.exports.supportedResorts = (supportedResortsArray) => {
  const supportedResorts = supportedResortsArray.join(', ');

  return `The currently supported resorts are: ${supportedResorts}. What else would you like to know?`;
};


const inchOrInches = (data) => {
  return data == 1 ? "inch" : "inches";
}

const dataErrorMessage = (resortName, dataType) => {
  return `Sorry, there was an error getting the ${dataType} for ${resortName}. If this issue persists please contact the developer.`;
}