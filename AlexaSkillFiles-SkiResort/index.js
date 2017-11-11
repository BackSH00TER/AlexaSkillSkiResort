'use strict';
var https = require('https');
var Alexa = require('alexa-sdk');
var db = require('./AWS_Helpers');

var APP_ID = "amzn1.ask.skill.e5412491-db0b-43bc-a0c0-80e97c784009";
var SKILL_NAME = "Snow Report";
var WELCOME_MESSAGE = "Welcome to Snow Report. What would you like to know?";
var HELP_MESSAGE = "INSERT HELP MESSAGE";
var HELP_REPROMPT = "INSERT HELP REPROMPT";
var DIDNT_UNDERSTAND_MESSAGE = "I'm sorry, I didn't understand that. Try again.";
var STOP_MESSAGE = "Goodbye!";
var ERROR_MESSAGE = "I'm sorry, there was an error with getting that information. Please try again.";

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
                outputMsg = ERROR_MESSAGE;
                this.emit(':ask', outputMsg);
            }
            else {
                var responseData = JSON.parse(response);
                var forecast = responseData.properties.periods[0].detailedForecast;
                outputMsg = forecast;
                this.emit(':tell', outputMsg);
            }

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
                outputMsg = ERROR_MESSAGE;
                this.emit(':ask', outputMsg);
            }
            else {
                var overNightSnow = response.Item.overNightSnowFall;
                outputMsg = "Steven's Pass got " + overNightSnow + " inches of snow over night.";
                this.emit(':tell', outputMsg);
            }
        });
    },
    'temperatureToday': function () {
        getWeather((response) => {
            if(response == null) {
                outputMsg = ERROR_MESSAGE;
                this.emit(':ask', outputMsg);
            }
            else {
                var responseData = JSON.parse(response);
                var temperature = responseData.properties.periods[0].temperature;
                var tempTrend = responseData.properties.periods[0].temperatureTrend;

                outputMsg = "The temperature is " + temperature + " degrees fahrenheit";

                if(tempTrend != "null") {
                    outputMsg += " and " + tempTrend;
                }
                this.emit(':tell', outputMsg);
            }
        })
    },
    'temperatureWeekDay': function() {
        var slotDay = this.event.request.intent.slots.Day.value;
        if(slotDay == "friday") { //TODO: wait till request schema is fixed to remove this
            slotDay == "Friday";
        }

        //Check if valid day
        var daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if(daysOfWeek.indexOf(slotDay) >= 0) {
            getWeather((response) => {
                if(response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);

                    //search for value of day asked for, make sure exists
                    var periodsNum =[];
                    for(var i = 0; i < responseData.properties.periods.length; i++) {
                        var obj = responseData.properties.periods[i].name;
                        if(obj.indexOf(slotDay) >= 0) {
                            periodsNum.push(i);
                        }
                    }
                    if(periodsNum == "") {
                        //day not found in response (either is asking for 7th day,
                        // or specially named holiday replaced day name IE: Veterans day instead of Saturday
                        console.log("Couldn't find weather data for day: " + slotDay);
                        this.emit(':tell', "Sorry, I don't have the extended for " + slotDay); //todo: check error response is appropriate
                    }
                    else {
                        outputMsg = slotDay + "'s temp will be a high of " + responseData.properties.periods[(periodsNum[0])].temperature;
                        if(periodsNum.length > 1) { //night
                            outputMsg += " with a low of " + responseData.properties.periods[(periodsNum[1])].temperature;
                        }
                        this.emit(':tell', outputMsg);
                    }
                }
            });
        }
        else {
            console.log("Day not recognized.");
            this.emit(':ask', "Sorry, I didn't understand that. Try again please."); //todo test is this is good response
        }
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
