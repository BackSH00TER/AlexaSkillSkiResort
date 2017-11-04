'use strict';
var https = require('https');
var Alexa = require('alexa-sdk');
var db = require('./AWS_Helpers');

var APP_ID = "INSERT_APP_ID";
var SKILL_NAME = "Snow Report";
var WELCOME_MESSAGE = "Welcome to Snow Report. What would you like to know?";
var HELP_MESSAGE = "INSERT HELP MESSAGE";
var HELP_REPROMPT = "INSERT HELP REPROMPT";
var DIDNT_UNDERSTAND_MESSAGE = "I'm sorry, I didn't understand that. Try again.";
var STOP_MESSAGE = "Goodbye!";

var outputMsg = "";

//=========================================================================================================================================
// Handlers
//=========================================================================================================================================
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', WELCOME_MESSAGE, HELP_MESSAGE);
    },
    'forecastToday': function () {
        getWeather((response) => {
            if(response == null) {
                //TODO handle error
                outputMsg = "Error";
            }
            else {
                var responseData = JSON.parse(response);
                var forecast = responseData.properties.periods[0].detailedForecast;
                outputMsg = forecast;
            }
            this.emit(':tell', outputMsg);
        })
    },
    'snowReportOvernight': function() {
        var params = {
            TableName: "SkiResortData",
            Key:{
                "resort": "Stevens Pass"
            }
        };

        db.getData(params, (response) => {
            //Empty response may be caused by incorrect resort name
            if(Object.keys(response).length === 0) {
                //todo handle error
                outputMsg = "error";
                console.log("some sort of error");
            }
            else {
                var overNightSnow = response.Item.overNightSnowFall;
                outputMsg = "Steven's Pass got " + overNightSnow + " inches of snow over night.";
            }
            this.emit(':tell', outputMsg);
        });
    },
    'temperatureToday': function () {
        getWeather((response) => {
            if(response == null) {
                //TODO handle error
                outputMsg = "Error";
            }
            else {
                var responseData = JSON.parse(response);
                var temperature = responseData.properties.periods[0].temperature;
                var tempTrend = responseData.properties.periods[0].temperatureTrend;
                outputMsg = "The temperature is " + temperature + " degrees fahrenheit and " + tempTrend + ".";
            }
            this.emit(':tell', outputMsg);
        })
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'Unhandled': function () {
        this.emit(':ask', DIDNT_UNDERSTAND_MESSAGE, HELP_REPROMPT);
    },
    'CatchAll': function () {
        this.emit(':ask', DIDNT_UNDERSTAND_MESSAGE, HELP_REPROMPT);
    }
};

//=========================================================================================================================================
// Helper functions
//=========================================================================================================================================

//Makes a request to get the 7 day forecast for Stevens Pass
//Returns a json object
function getWeather(callback) {
    var options = {
        host: 'api.weather.gov',
        path: '/points/47.7459,-121.0891/forecast',
        method: 'GET',
        headers: {
            'user-agent': 'Snow-Report,',
            'accept': 'application/json'
        }
    };

    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData += chunk;
        });

        res.on('end', () => {
            callback(returnData);
        });
    });
    req.end();
};
