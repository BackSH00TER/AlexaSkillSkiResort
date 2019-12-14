const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('./AWS_Helpers');
const fs = require('fs');


scrapeSite(
    "https://www.onthesnow.com/washington/stevens-pass-resort/historical-snowfall.html",
    "stevens.json",
    (data) => {
        console.log(
            "resort "+  data.resort + "\n" +
            "overNightSnowFall "+ data.type.overNightSnowFall+"\n" +
            "snowFallOneDay "+ data.type.snowFallOneDay+"\n" +
            "snowFallTwoDay "+ data.type.snowFallTwoDay+"\n" +
            "snowDepthBase "+ data.type.snowDepthBase+"\n" +
            "snowDepthMidMtn "+ data.type.snowDepthMidMtn+"\n" +
            "seasonSnowFall "+ data.type.seasonSnowFall

        );
    }
    )

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
            //Need to find way to properly store these in the resort json files and parse out (could just use .js file and export the object)
            //Marked N/A if info not found on site
            //------------------------------------------------------------------------------
            //------------------                SELECTORS             ----------------------
            //------------------------------------------------------------------------------
            var currentResort = "";

            // Using onThesnow for now, stevens website loading dynamically
            var stevensPass = { // TODO: Going to need to try out using Puppeteer to scrape since content is loaded dynamically
                resort: "Stevens Pass",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallOneDay: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('#view .item strong')[2]).text().slice(0, -1),
                    snowDepthMidMtn: $($('#view .item strong')[4]).text().slice(0, -1),
                    seasonSnowFall: $($('#view .item strong')[0]).text().slice(0, -1),
                }
            };

            // Stats given for Summit West
            var snoqualmiePass = {
                resort: "Snoqualmie Pass",
                selectors: {
                    reportDateUpdated: $($('#block-conditions-overview .subtitle')).text(),
                    overNightSnowFall: $($('.flex .box.box_right5 .text .js-measurement')[18]).text(),
                    snowFallOneDay: $($('.flex .box.box_right5 .text .js-measurement')[20]).text(),
                    snowFallTwoDay: $($('.flex .box.box_right5 .text .js-measurement')[21]).text(),
                    snowDepthBase: $($('.flex .box.box_right5 .text .js-measurement')[23]).text(),
                    snowDepthMidMtn: $($('.flex .box.box_right5 .text .js-measurement')[23]).text(),
                    seasonSnowFall: $($('.flex .box.box_right5 .text .js-measurement')[22]).text(),
                }
            };

            // using OnTheSnow for now, crystal website loading dynamically
            var crystalMountain = {
                resort: "Crystal Mountain",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallOneDay: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('#view .item strong')[2]).text().slice(0, -1),
                    snowDepthMidMtn: $($('#view .item strong')[4]).text().slice(0, -1),
                    seasonSnowFall: $($('#view .item strong')[0]).text().slice(0, -1),
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
                    overNightSnowFall: $($('.weather.data-table .odd .data')[5]).text() == '-' ? "N/A" : $($('.weather.data-table .odd .data')[5]).text().slice(0, -1),
                    snowFallOneDay: $($('.weather.data-table .even .data')[2]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[2]).text().slice(0, -1),
                    snowFallTwoDay: $($('.weather.data-table .odd .data')[2]).text() == "-" ? "N/A" : $($('.weather.data-table .odd .data')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.weather.data-table .odd .data')[14]).text() == "-" ? "N/A" : $($('.weather.data-table .odd .data')[14]).text().slice(0, -1).replace(/\D/g,''),
                    snowDepthMidMtn: $($('.weather.data-table .odd .data')[12]).text() == "-" ? "N/A" : $($('.weather.data-table .odd .data')[12]).text().slice(0, -1).replace(/\D/g,''),
                    seasonSnowFall: "N/A"
                }
            };

            var mtHoodMeadows = {
                resort: "Mount Hood",
                selectors: {
                    reportDateUpdated: $('.conditions-glance-widget .conditions-current ').text().trim(),
                    overNightSnowFall: $($('.reading.depth')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.reading.depth')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.reading.depth')[2]).text().slice(0, -1),
                    snowDepthBase: $('.snowdepth-base .reading.depth').text().substring(5).split("\"", 1)[0],
                    snowDepthMidMtn: $('.snowdepth-mid .reading.depth').text().substring(4).split("\"", 1)[0],
                    seasonSnowFall: $('.snowdepth-ytd .reading.depth').text().slice(0, -1)
                }
            };

            var mtHoodTimberline = {
                resort: "Mt Hood Timberline",
                selectors: {
                    reportDateUpdated: $('.conditions-panel .bg-dark-blue .uk-text-contrast').text().trim(),
                    overNightSnowFall: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[1]).text().slice(0,-1),
                    snowFallOneDay: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[2]).text().slice(0,-1),
                    snowFallTwoDay: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[3]).text().slice(0,-1),
                    snowDepthBase: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[4]).text().slice(0,-1),
                    snowDepthMidMtn: 'N/A',
                    seasonSnowFall: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[8]).text().slice(0,-1),
                }
            };

            var mtHoodSkibowl = {
                resort: "Mt Hood Skibowl",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: "N/A",
                    snowFallOneDay: "N/A",
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('.currentConditions td')[9]).text().split("-",1)[0].trim().slice(0,-1),
                    snowDepthMidMtn: $($('.currentConditions .info')[4]).text().split("-").pop().slice(0,-1).trim(),
                    seasonSnowFall: $($('.currentConditions td')[11]).text().slice(0,-1)
                }
            };

            var mtBachelor = {
                resort: "Mount Bachelor",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.key')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.key')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.key')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.key')[11]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.key')[5]).text().slice(0, -1),
                    seasonSnowFall: $($('.key')[10]).text().slice(0, -1),
                }
            };

            var schweitzer = {
                resort: "Schweitzer",
                selectors: {
                    reportDateUpdated: $('.snow-report-last-updated').text(),
                    overNightSnowFall: $($('.quickList .hour .convert.inches')[0]).text().trim().slice(0, -1),
                    snowFallOneDay: $($('.quickList .hour .convert.inches')[1]).text().trim().slice(0, -1),
                    snowFallTwoDay: $($('.quickList .hour .convert.inches')[2]).text().trim().slice(0, -1),
                    snowDepthBase: $($('.quickList.depths .convert.inches')[2]).text().trim().slice(0, -1),
                    snowDepthMidMtn: $($('.quickList.depths .convert.inches')[1]).text().trim().slice(0, -1),
                    seasonSnowFall: $($('.quickList .season .convert.inches')).text().trim().slice(0, -1),
                }
            };

            var sunValley = {
                resort: "Sun Valley",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.weather-time h3')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.weather-time h3')[1]).text().slice(0, -1),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('.weather-data h3')[0]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.weather-data h3')[1]).text().slice(0, -1),
                    seasonSnowFall: "N/A"
                }
            };

            var mammothMountain = {
                resort: "Mammoth Mountain",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.weather-section.snow-report.winter span')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.weather-section.snow-report.winter span')[0]).text().slice(0, -1),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('.weather-section.base.winter span')[1]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.weather-section.base.winter span')[2]).text().slice(0, -1),
                    seasonSnowFall: $($('.weather-section.snow-report.winter span')[1]).text().slice(0, -1)
                }
            };

            var bigBear = {
                resort: "Big Bear Mountain",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.forecast-day-block h4')[0]).text(),
                    snowFallOneDay: $($('.forecast-day-block h4')[0]).text(),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('.forecast-day-block h4')[3]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.forecast-day-block h4')[4]).text().slice(0, -1),
                    seasonSnowFall: $($('.forecast-day-block h4')[1]).text().slice(0, -1)
                }
            };

            // Breckenridge getting data from onthesnow because breckenridge site is weird to scrape
            var breckenridge = {
                resort: "Breckenridge",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallOneDay: $($('.sbox.sm.box_shadow .bluetxt.sfa')).text().slice(0, -1),
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('#view .item strong')[2]).text().slice(0, -1),
                    snowDepthMidMtn: $($('#view .item strong')[4]).text().slice(0, -1),
                    seasonSnowFall: $($('#view .item strong')[0]).text().slice(0, -1),
                }
            };
            
            var mtWashington = {
                resort: "Mt Washington",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: isNaN(Math.round($($('#ROW_ID .span3 span')[0]).text().slice(0, -2) * 0.39370079)) ? 'N/A' : Math.round($($('#ROW_ID .span3 span')[0]).text().slice(0, -2) * 0.39370079),
                    snowFallOneDay: isNaN(Math.round($($('#ROW_ID .span3 span')[2]).text().slice(0, -2) * 0.39370079)) ? 'N/A' : Math.round($($('#ROW_ID .span3 span')[2]).text().slice(0, -2) * 0.39370079),
                    snowFallTwoDay: isNaN(Math.round($($('#ROW_ID .span3 span')[4]).text().slice(0, -2) * 0.39370079)) ? 'N/A' : Math.round($($('#ROW_ID .span3 span')[4]).text().slice(0, -2) * 0.39370079),
                    snowDepthBase: isNaN(Math.round($($('#ROW_ID .span3 span')[6]).text().slice(0, -2) * 0.39370079)) ? 'N/A' : Math.round($($('#ROW_ID .span3 span')[6]).text().slice(0, -2) * 0.39370079),
                    snowDepthMidMtn: "N/A",
                    seasonSnowFall: "N/A",
                }
            };

            // Utah Resorts pulled from same site, selectors are the same
            var utahGeneric = {
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: "N/A",
                    snowFallOneDay: $($('.snowfall-24 .amounts span[data-length-inches]')).text(),
                    snowFallTwoDay: $($('.snowfall-history.hour48 span[data-length-inches]')[0]).text(),
                    snowDepthBase: $($('.snowfall-history.base span[data-length-inches]')[0]).text(),
                    snowDepthMidMtn: "N/A",
                    seasonSnowFall:  $($('.snowfall-history.ytd span[data-length-inches]')[0]).text(),
                }
            };

            var snowbird = {
                ...utahGeneric,
                resort: "Snowbird"
            };

            var alta = {
                ...utahGeneric,
                resort: "Alta"
            };

            var brighton = {
                ...utahGeneric,
                resort: "Brighton"
            };

            var solitude = {
                ...utahGeneric,
                resort: "Solitude"
            };

            var deerValley = {
                ...utahGeneric,
                resort: "Deer Valley"
            };

            var parkCity = {
                ...utahGeneric,
                resort: "Park City"
            };

            var sundance = {
                ...utahGeneric,
                resort: "Sundance"
            };

            var nordicValley = {
                ...utahGeneric,
                resort: "Nordic Valley"
            };

            var powderMountain = {
                ...utahGeneric,
                resort: "Powder Mountain"
            };

            var snowbasin = {
                ...utahGeneric,
                resort: "Snowbasin"
            };

            var brianHead = {
                ...utahGeneric,
                resort: "Brian Head"
            };

            var eaglePoint = {
                ...utahGeneric,
                resort: "Eagle Point"
            };

            var beaver = {
                ...utahGeneric,
                resort: "Beaver"
            };

            //Assign current resort to use selectors of the currently selected resort
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
                case "mthoodmeadows.json":
                    currentResort = mtHoodMeadows;
                    break;
                case "mthoodtimberline.json":
                    currentResort = mtHoodTimberline;
                    break;
                case "mthoodskibowl.json":
                    currentResort = mtHoodSkibowl;
                    break;
                case "mtbachelor.json":
                    currentResort = mtBachelor;
                    break;
                case "schweitzer.json":
                    currentResort = schweitzer;
                    break;
                case "sun_valley.json":
                    currentResort = sunValley;
                    break;
                case "mammoth_mountain.json":
                    currentResort = mammothMountain;
                    break;
                case "big_bear.json":
                    currentResort = bigBear;
                    break;
                case "breckenridge.json":
                    currentResort = breckenridge;
                    break;
                case "mtwashington.json":
                    currentResort = mtWashington;
                    break;
                case "snowbird.json":
                    currentResort = snowbird;
                    break;
                case "alta.json":
                    currentResort = alta;
                    break;
                case "brighton.json":
                    currentResort = brighton;
                    break;
                case "solitude.json":
                    currentResort = solitude;
                    break;
                case "deer_valley.json":
                    currentResort = deerValley;
                    break;
                case "park_city.json":
                    currentResort = parkCity;
                    break;
                case "sundance.json":
                    currentResort = sundance;
                    break;
                case "nordic_valley.json":
                    currentResort = nordicValley;
                    break;
                case "powder_mountain.json":
                    currentResort = powderMountain;
                    break;
                case "snowbasin.json":
                    currentResort = snowbasin;
                    break;
                case "brian_head.json":
                    currentResort = brianHead;
                    break;
                case "eagle_point.json":
                    currentResort = eaglePoint;
                    break;
                case "beaver.json":
                    currentResort = beaver;
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