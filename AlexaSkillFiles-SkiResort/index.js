'use strict';
var https = require('https');
var Alexa = require('alexa-sdk');
var db = require('./AWS_Helpers');

var APP_ID = "amzn1.ask.skill.e5412491-db0b-43bc-a0c0-80e97c784009";
var SKILL_NAME = "Snow Report";
var WELCOME_MESSAGE = "Welcome to Snow Report. You can ask me about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?";
var HELP_MESSAGE = "You can ask me questions about the temperature, forecast, or snow reports for your favorite ski resorts. What would you like to know?";
var HELP_REPROMPT = "Ask me about the forecast, temperature, or snow reports for the following ski resorts, Stevens Pass, Snoqualmie Pass, Crystal Mountain, Mount Baker, or Mission Ridge. What would you like to know?";
var DIDNT_UNDERSTAND_MESSAGE = "I'm sorry, I didn't understand that. Try asking your question again.";
var STOP_MESSAGE = "Cya later, have fun on the slopes!";
var ERROR_MESSAGE = "I'm sorry, there was an error with getting that information from the database. Please try asking your question again.";
var UNKNOWN_RESORT = "Sorry, I didn't catch the resort you said. Try asking again with one of the supported resorts.";
var UNKOWN_RESORT_REPROMPT = "I didn't hear the resort you were asking about. Try asking the question again using one of the supported resorts.";
var INVALID_RESORT = "Sorry, I don't currently support that resort. Try asking your question again using one of the supported resorts. Just ask me if you dont know which resorts are supported."
var INVALID_RESORT_REPROMPT = "The resort you asked about is currently unsupported, you can contact the developer and request that this resort be added. In the meantime, ask me which resorts are supported and then ask your question again.";
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
    'forecastToday': function ()  {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) { //todo: need to check status code, resolution.status.code, if match or no match
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) { //missing a value for slot, dont continue
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            getWeather(resortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        if(resortName === "ERROR"){
                            outputMsg = INVALID_RESORT;
                        }
                        else {
                            outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                        }
                        this.emit(':ask', outputMsg);
                    }
                    else {
                        var forecast = responseData.properties.periods[0].detailedForecast;
                        outputMsg = "Today's forecast for " + resortName + " is, " + forecast;
                    }
                    this.emit(':tell', outputMsg);
                }
            })
        }
    },
    'forecastWeek': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            getWeather(resortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        if(resortName === "ERROR"){
                            outputMsg = INVALID_RESORT;
                        }
                        else {
                            outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                        }
                        this.emit(':ask', outputMsg);
                    }
                    else {
                        var day = responseData.properties.periods[0].name;
                        var startCount = 0;
                        if (day == "This Morning" || day == "This Afternoon" || day == "Today") { //todo whatever else it could equal if today
                            startCount = 2;
                        }
                        else if (day == "Tonight") {
                            startCount = 1;
                        }

                        var outputMsg = "The forecast for " + resortName + " is: ";
                        var obj, tempLow, tempHigh, shortForecast;
                        for (var i = startCount; i < responseData.properties.periods.length; i += 2) {
                            obj = responseData.properties.periods[i].name;

                            tempLow = "";
                            tempHigh = responseData.properties.periods[i].temperature;
                            shortForecast = responseData.properties.periods[i].shortForecast;
                            if (i < responseData.properties.periods.length - 1) {
                                tempLow = responseData.properties.periods[i + 1].temperature;
                            }

                            outputMsg += obj;
                            if (tempLow !== "") {
                                outputMsg += " a low of " + tempLow + " with a high of " + tempHigh + ", " + shortForecast + ". ";
                            }
                            else {
                                outputMsg += " a high of " + tempHigh + ", " + shortForecast + ". ";
                            }
                        }
                        console.log(outputMsg);
                        this.emit(":tell", outputMsg);
                    }
                }
            })
        }
    },
    'forecastWeekDay': function () {
        var slotDay = this.event.request.intent.slots.Day.value;
        if (slotDay === "friday") { //TODO: wait till request schema is fixed to remove this
            slotDay = "Friday";
        }

        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            //Check if valid day
            var daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (daysOfWeek.indexOf(slotDay) >= 0) {
                getWeather(resortID, (response) => {
                        if (response == null) {
                            outputMsg = ERROR_MESSAGE;
                            this.emit(':ask', outputMsg);
                        }
                        else {
                            var responseData = JSON.parse(response);
                            if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                                if(resortName === "ERROR"){
                                    outputMsg = INVALID_RESORT;
                                }
                                else {
                                    outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                                }
                                this.emit(':ask', outputMsg);
                            }
                            else {
                                //search for value of day asked for, make sure exists
                                var periodsNum = [];
                                for (var i = 0; i < responseData.properties.periods.length; i++) {
                                    var obj = responseData.properties.periods[i].name;
                                    if (obj.indexOf(slotDay) >= 0) {
                                        periodsNum.push(i);
                                    }
                                }
                                if (periodsNum == "") {
                                    //day not found in response (either is asking for 7th day,
                                    // or specially named holiday replaced day name IE: Veterans day instead of Saturday
                                    console.log("Couldn't find weather data for day: " + slotDay);
                                    this.emit(':tell', "Sorry, I don't have the extended forecast for " + slotDay);
                                }
                                else {
                                    var detailedForecast = responseData.properties.periods[(periodsNum[0])].detailedForecast;
                                    outputMsg = "At " + resortName + " on " + slotDay + " there will be a high of " + responseData.properties.periods[(periodsNum[0])].temperature;
                                    if (periodsNum.length > 1) { //night
                                        outputMsg += " with a low of " + responseData.properties.periods[(periodsNum[1])].temperature;
                                    }

                                    outputMsg += ". The forecast calls for, " + detailedForecast;
                                    this.emit(':tell', outputMsg);
                                }
                            }
                        }
                    }
                );
            }
            else {
                console.log("Day not recognized.");
                this.emit(':ask', "Sorry, I didn't catch the day you were looking for. Try asking the question again please.");
            }
        }
    },
    'forecastTomorrow': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            getWeather(resortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        if (resortName === "ERROR") {
                            outputMsg = INVALID_RESORT;
                        }
                        else {
                            outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                        }
                        this.emit(':ask', outputMsg);
                    }
                    else {
                        var day = responseData.properties.periods[0].name;
                        var indexTomorrow = (day == "Tonight") ? 1 : 2;

                        var tempHigh = responseData.properties.periods[indexTomorrow].temperature;
                        var tempLow = responseData.properties.periods[indexTomorrow + 1].temperature;
                        var detailedForecast = responseData.properties.periods[indexTomorrow].detailedForecast;

                        outputMsg = "Tomorrow at " + resortName + " there will be a high of " + tempHigh + " with a low of " + tempLow + " degrees."
                        outputMsg += " The forecast calls for " + detailedForecast;

                        this.emit(':tell', outputMsg);
                    }
                }
            });
        }
    },
    'snowReportOvernight': function ()  {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            var params = {
                TableName: "SkiResortData",
                Key: {
                    "resort": resortName
                }
            };

            db.getData(params, (response) => {
                //Empty response may be caused by incorrect resort name
                if (Object.keys(response).length === 0) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var overNightSnow = response.Item.overNightSnowFall;
                    if(overNightSnow === "FAIL") {
                        outputMsg = "Sorry, there was an error getting the over night snow fall at this time. If this issue persists please contact the developer."
                    }
                    else if(overNightSnow === "N/A") {
                        outputMsg = "Sorry, I don't currently support getting the over night snow fall for " + resortName;
                    }
                    else {
                        var inch = (overNightSnow == 1) ? "inch" : "inches";
                        outputMsg = resortName + " got " + overNightSnow + " " + inch + " of snow over night.";
                    }
                    this.emit(':tell', outputMsg);
                }
            });
        }
    },
    'snowReportOneDay': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            var params = {
                TableName: "SkiResortData",
                Key: {
                    "resort": resortName
                }
            };

            db.getData(params, (response) => {
                //Empty response may be caused by incorrect resort name
                if (Object.keys(response).length === 0) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var snowFall = response.Item.snowFallOneDay;
                    var twoDay = response.Item.snowFallTwoDay;
                    var inchOne = (snowFall == 1) ? "inch" : "inches";
                    var inchTwo = (twoDay == 1) ? "inch" : "inches";

                    if(snowFall === "N/A" && twoDay === "N/A") {
                        outputMsg = "Sorry, I don't currently support getting yesterdays snow report for " + resortName;
                    }
                    else if((snowFall === "FAIL" && twoDay === "FAIL") || (snowFall === "FAIL" && twoDay === "N/A") || (snowFall === "N/A" && twoDay === "FAIL")) {
                        outputMsg = "Sorry, there was an error getting yesterdays snow report for " + resortName + ". If this issue persists please contact the developer.";
                    }
                    else if((snowFall !== "FAIL" && snowFall !== "N/A") && (twoDay === "N/A" || twoDay === "FAIL")) {
                        outputMsg = resortName + " got " + snowFall + " " + inchOne + " of snow yesterday.";
                    }
                    else if((twoDay !== "N/A" && twoDay !== "FAIL") && (snowFall === "FAIL" || snowFall === "N/A")) {
                        outputMsg = resortName + " got " + twoDay + " " + inchTwo + " of snow in the past two days.";
                    }
                    else {
                        outputMsg = resortName + " got " + snowFall + " " + inchOne + " of snow yesterday and a total of " + twoDay + " " + inchTwo + " in the last two days.";
                    }
                    this.emit(':tell', outputMsg);
                }
            });
        }
    },
    'snowReportSeasonTotal': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            var params = {
                TableName: "SkiResortData",
                Key: {
                    "resort": resortName
                }
            };

            db.getData(params, (response) => {
                //Empty response may be caused by incorrect resort name
                if (Object.keys(response).length === 0) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var snowFall = response.Item.seasonSnowFall;
                    if(snowFall === "FAIL") {
                        outputMsg = "Sorry, there was an error getting the season snow fall for " + resortName + ". If this issue persists please contact the developer.";
                    }
                    else if(snowFall === "N/A") {
                        outputMsg = "Sorry, I don't current support getting the season snow fall for " + resortName;
                    }
                    else {
                        outputMsg = "The season total of snow fall at " + resortName + " is " + snowFall + " inches";
                    }
                    this.emit(':tell', outputMsg);
                }
            });
        }
    },
    'snowReportDepth': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            var params = {
                TableName: "SkiResortData",
                Key: {
                    "resort": resortName
                }
            };

            db.getData(params, (response) => {
                //Empty response may be caused by incorrect resort name
                if (Object.keys(response).length === 0) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    outputMsg = "";
                    var base = response.Item.snowDepthBase;
                    var midMtn = response.Item.snowDepthMidMtn;
                    var seasonTotal = response.Item.seasonSnowFall;
                    var twoDay = response.Item.snowFallTwoDay;
                    var twoDayInches = (twoDay == 1) ? "inch" : "inches";

                    var status1 = false;
                    var status2 = false;
                    var status3 = false;

                    if(twoDay !== "N/A" && twoDay !== "FAIL") {
                        outputMsg = "In the last two days " + resortName + " has received " + twoDay + " " + twoDayInches + " of new snow.";
                        status1 = true;
                    }
                    if((base !== "N/A" && midMtn !== "FAIL") && (midMtn !== "N/A" && midMtn !== "FAIL")) {
                        outputMsg += " The base depth is currently at " + base + " inches and mid mountain is at " + midMtn + " inches.";
                        status2 = true;
                    }
                    if(seasonTotal !== "N/A" && seasonTotal !== "FAIL") {
                        outputMsg += " The season total is " + seasonTotal + " inches.";
                        status3 = true;
                    }
                    if(!status1 && !status2 && !status3) {
                        outputMsg = "Sorry, there was an error getting the season total snow fall for " + resortName + ". If this issue persists please contact the developer.";
                    }
                    this.emit(':tell', outputMsg);
                }
            });
        }
    },
    'temperatureToday': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/

        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            getWeather(resortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        if(resortName === "ERROR"){
                            outputMsg = INVALID_RESORT;
                        }
                        else {
                            outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                        }
                        this.emit(':ask', outputMsg);
                    }
                    else {
                        var temperature = responseData.properties.periods[0].temperature;
                        var tempTrend = responseData.properties.periods[0].temperatureTrend;
                        var shortForecast = responseData.properties.periods[0].shortForecast;

                        outputMsg = "The temperature at " + resortName + " is " + temperature + " degrees";

                        if (tempTrend !== "null" && tempTrend != null) {
                            outputMsg += " and " + tempTrend;
                        }

                        outputMsg += ", with a forecast of " + shortForecast;
                    }
                    this.emit(':tell', outputMsg);
                }
            })
        }
    },
    'temperatureTonight': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            getWeather(resortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        if(resortName === "ERROR"){
                            outputMsg = INVALID_RESORT;
                        }
                        else {
                            outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                        }
                        this.emit(':ask', outputMsg);
                    }
                    else {
                        var day = responseData.properties.periods[0].name;
                        var index = (day == "Tonight") ? 0 : 1;

                        var temp = responseData.properties.periods[index].temperature;
                        outputMsg = "Tonights temperature at " + resortName + " will be " + temp + " degrees.";
                        this.emit(':tell', outputMsg);
                    }
                }
            })
        }
    },
    'temperatureWeekDay': function () {
        var slotDay = this.event.request.intent.slots.Day.value;
        if (slotDay === "friday") { //TODO: wait till request schema is fixed to remove this
            slotDay = "Friday";
        }

        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID = "";
        /*if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }*/
        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort, missing resort value");
            this.emit(':ask', UNKNOWN_RESORT, UNKOWN_RESORT_REPROMPT);
        }

        console.log("Resort is: " + slotResort);
        //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
        resortID = getResortID(slotResort);
        console.log("resortID from func: " + resortID);

        var resortName = resortID.split('_').join(' ');
        //-------------------------------------
        if(resortID === "ERROR"){ //check if value is valid/supported resort
            console.log("Given an invalid, unsupported resort value");
            this.emit(':ask', INVALID_RESORT, INVALID_RESORT_REPROMPT);
        }
        else {
            //Check if valid day
            var daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (daysOfWeek.indexOf(slotDay) >= 0) {
                getWeather(resortID, (response) => {
                        if (response == null) {
                            outputMsg = ERROR_MESSAGE;
                            this.emit(':ask', outputMsg);
                        }
                        else {
                            var responseData = JSON.parse(response);
                            if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                                if(resortName === "ERROR"){
                                    outputMsg = INVALID_RESORT;
                                }
                                else {
                                    outputMsg = "There was an error getting the weather for " + resortName + " , try asking again.";
                                }
                                this.emit(':ask', outputMsg);
                            }
                            else {
                                //search for value of day asked for, make sure exists
                                var periodsNum = [];
                                for (var i = 0; i < responseData.properties.periods.length; i++) {
                                    var obj = responseData.properties.periods[i].name;
                                    if (obj.indexOf(slotDay) >= 0) {
                                        periodsNum.push(i);
                                    }
                                }
                                if (periodsNum == "") {
                                    //day not found in response (either is asking for 7th day,
                                    // or specially named holiday replaced day name IE: Veterans day instead of Saturday
                                    console.log("Couldn't find weather data for day: " + slotDay);
                                    this.emit(':tell', "Sorry, I don't have the extended forecast for " + slotDay); //todo: check error response is appropriate
                                }
                                else {
                                    var shortForecast = responseData.properties.periods[(periodsNum[0])].shortForecast;
                                    outputMsg = "The temperature at " + resortName + " on " + slotDay + " will be a high of " + responseData.properties.periods[(periodsNum[0])].temperature;
                                    if (periodsNum.length > 1) { //night
                                        outputMsg += " with a low of " + responseData.properties.periods[(periodsNum[1])].temperature;
                                    }

                                    outputMsg += ", and a forecast of " + shortForecast;
                                    this.emit(':tell', outputMsg);
                                }
                            }
                        }
                    }
                );
            }
            else {
                console.log("Day not recognized.");
                this.emit(':ask', "Sorry, I didn't catch the day you were looking for. Try asking the question again please.");
            }
        }
    },
    'supportedResorts': function () {
      outputMsg = "The resorts that I currently support are ";
      outputMsg += "Stevens Pass, Snoqualmie Pass, Crystal Mountain, Mount Baker, and Mission Ridge. What else would you like to know?"
        this.emit(':ask', outputMsg);
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
function getWeather(resort, callback) {
    var urlPath = "";
    switch (resort) {
        case "Stevens_Pass":
            urlPath = '/points/47.7459,-121.0891/forecast';
            console.log("Stevens Pass Weather");
            break;
        case "Snoqualmie_Pass":
            urlPath = '/points/47.4374,-121.4154/forecast';
            console.log("Snoqualmie weather");
            break;
        case "Crystal_Mountain":
            urlPath = '/points/46.9291,-121.501/forecast';
            console.log("Crystal weather");
            break;
        case "Mt_Baker":
            urlPath = '/points/48.8541,-121.68/forecast';
            console.log("Baker weather");
            break;
        case "Mission_Ridge":
            urlPath = '/points/47.2867,-120.4184/forecast';
            console.log("Mission ridge weather");
            break;
        default:

            break;
    }
    var options = {
        host: 'api.weather.gov',
        path: urlPath,
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


//used to check the synonyms of returned slot values
//A temp fix until Skills Dashboard returns resolutions
function getResortID(slotResort) {
    var slotResortID = "";
    slotResort = slotResort.toLowerCase();
    switch (slotResort) {
        case "stevens":
        case "stevens pass":
            slotResortID = "Stevens_Pass";
            break;
        case "snoqualmie":
        case "snoqualmie pass":
            slotResortID = "Snoqualmie_Pass";
            break;
        case "crystal":
        case "crystal mountain":
            slotResortID = "Crystal_Mountain";
            break;
        case "mount baker":
        case "mt baker":
        case "baker":
            slotResortID = "Mt_Baker";
            break;
        case "mission ridge":
            slotResortID = "Mission_Ridge";
            break;
        default:
            slotResortID = "ERROR";
    }
    return slotResortID;
}
