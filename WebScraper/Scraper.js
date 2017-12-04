const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('./AWS_Helpers');
const fs = require('fs');

//--------------CALL LAMBDA TEST TO RUN exports.handler locally--------------------


exports.handler = function(event, context, callback) {
    var pwd = __dirname;
    var dir = pwd + '/resorts';
    getListOfFiles(dir, (resortList) => {
        console.log("Reading from each file");

        resortList.forEach(function (resort, index) {
            fs.readFile(dir + "/" + resortList[index], function (err, data) {
                var parsedData = JSON.parse(data);
                var url = parsedData.url;
                console.log("Call scraper now for: " + resort);
                scrapeSite(url, resort, (data) => {
                    if (data === "ERROR") {
                        console.log("Error occurred in scraping: " + resort);
                    }
                    else {
                        console.log("Data for: " + data.resort);

                        //Before sending data, loop over and check for blank value
                        //Blank value indicates selector failed to get value from website (probably broken selector)
                        for (var res in data.type) {
                            if(data.type[res] === "") {
                                console.log("Data of : " + data.resort + " " + res + " equals blank"); //TODO find way to alert of this
                                data.type[res] = "FAIL";
                            }
                        }
                        console.log(data);
                        var params = {
                            TableName: "SkiResortData",
                            Item: {
                                "resort": data.resort,
                                "overNightSnowFall": data.type.overNightSnowFall,
                                "snowFallOneDay": data.type.snowFallOneDay,
                                "snowFallTwoDay": data.type.snowFallTwoDay,
                                "snowDepthBase": data.type.snowDepthBase,
                                "snowDepthMidMtn": data.type.snowDepthMidMtn,
                                "seasonSnowFall": data.type.seasonSnowFall
                            }
                        };
                        console.log("Adding data to database...");
                        db.putData(params, (response) => {
                            if (response == "FAILED") {
                                console.log("DB Error: Unable to add " + params.Item.resort);
                            }
                            else {
                                console.log("Data push successful");
                            }
                        });
                    }
                });
            })
        })
    });

    function scrapeSite(url, resort, callback) {
        const options = {
            uri: url,
            transform: function (body) {
                return cheerio.load(body);
            }
        };

        console.log("Fetching data from site...");
        rp(options)
            .then(($) => {
                console.log("Data received");

                //Temporary solution for selectors
                //Need to find way to properly store these in the resort json files and parse out
                var currentResort = "";
                var stevensPass = {
                    resort: "Stevens Pass",
                    selectors: {
                        reportDateUpdated: $('.page-report-snowfall-value').text(),
                        overNightSnowFall: $($('.page-report-snowfall-value')[0]).text().slice(0, -1),
                        snowFallOneDay: $($('.page-report-snowfall-value')[1]).text().slice(0, -1),
                        snowFallTwoDay: $($('.page-report-snowfall-value')[2]).text().slice(0, -1),
                        snowDepthBase: $($('.page-report-snowdepth-value')[0]).text().slice(0, -1),
                        snowDepthMidMtn: $($('.page-report-snowdepth-value')[1]).text().slice(0, -1),
                        seasonSnowFall: $($('.page-report-snowdepth-value')[2]).text().slice(0, -1)
                    }
                };

                var snoqualmiePass = {
                    resort: "Snoqualmie Pass",
                    selectors: {
                        reportDateUpdated: $($('#block-conditions-overview .subtitle')).text(),
                        overNightSnowFall: $($('.condition-snow .value')[0]).text(),
                        snowFallOneDay: $($('.condition-snow .value')[10]).text(),
                        snowFallTwoDay: $($('.condition-snow .value')[11]).text(),
                        snowDepthBase: $($('.condition-snow-base .value')[2]).text(),
                        snowDepthMidMtn: $($('.condition-snow-base .value')[1]).text(),
                        seasonSnowFall: $($('.content .total .value')[0]).text().slice(0, -1)
                    }
                };

                var crystalMountain = {
                    resort: "Crystal Mountain",
                    selectors: {
                        reportDateUpdated: "N/A",
                        overNightSnowFall: $('#overnight2').text().slice(0, -1),
                        snowFallOneDay: $('#hours-24-2').text().slice(0, -1),
                        snowFallTwoDay: $('#hours-48-2').text().slice(0, -1),
                        snowDepthBase: $('#bottom-depth').text().slice(0, -1),
                        snowDepthMidMtn: $('#top-depth').text().slice(0, -1),
                        seasonSnowFall: $('#season-total').text().slice(0, -1)
                    }
                };

                var mtBaker = {
                    resort: "Mount Baker",
                    selectors: {
                        reportDateUpdated: $('.report-timestamp').text().replace(/\n/g, "").replace("//", ", "),
                        overNightSnowFall: $('.report-snowfall-value-12 .unit-i').text().slice(0, -1),
                        snowFallOneDay: $('.report-snowfall-value-24 .unit-i').text().slice(0, -1),
                        snowFallTwoDay: $('.report-snowfall-value-48 .unit-i').text().slice(0, -1),
                        snowDepthBase: $($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1),
                        snowDepthMidMtn: $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1),
                        seasonSnowFall: ($($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1)) >= $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1) ? ($($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1)) : $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1)
                    }
                };

                var missionRidge = {
                    resort: "Mission Ridge",
                    selectors: {
                        reportDateUpdated: $('.bluebar-time').text().trim(),
                        overNightSnowFall: $($('.weather.data-table .odd .data')[5]).text().slice(0, -1),
                        snowFallOneDay: $($('.weather.data-table .even .data')[2]).text().slice(0, -1),
                        snowFallTwoDay: $($('.weather.data-table .odd .data')[2]).text().slice(0, -1),
                        snowDepthBase: $($('.weather.data-table .even .data')[11]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[11]).text().slice(0, -1),
                        snowDepthMidMtn: $($('.weather.data-table .even .data')[9]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[9]).text().slice(0, -1),
                        seasonSnowFall: "N/A"
                    }
                };

                switch (resort) {
                    case "stevens.json":
                        currentResort = stevensPass;
                        break;
                    case "crystal.json":
                        currentResort = crystalMountain;
                        break;
                    case "snoqualmie.json":
                        currentResort = snoqualmiePass;
                        break;
                    case "baker.json":
                        currentResort = mtBaker;
                        break;
                    case "mission_ridge.json":
                        currentResort = missionRidge;
                        break;
                    default:
                        callback("ERROR: Invalid Resort");
                        break;
                }

                var data = {
                    resort: currentResort.resort,
                    type: currentResort.selectors
                };
                callback(data);
            })
            .catch((err) => {
                console.log(err);
                callback("ERROR");
            });
    };

    function getListOfFiles(dir, callback) {
        //Read all json files from directory
        fs.readdir(dir, function (err, resortList) {
            console.log("Reading resorts from directory: " + dir);
            if (err) {
                console.log("ERROR getting resort json files from directory w/ msg:  " + err);
            }
            else {
                callback(resortList);
            }
        });
    };
}