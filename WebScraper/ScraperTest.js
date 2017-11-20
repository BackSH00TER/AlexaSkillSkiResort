const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('../AWS_Helpers');
const fs = require('fs');


var dir = './WebScraper/resorts';
// function getListOfFiles(dir, callback) {
//     //Read all json files from directory
//     fs.readdir(dir, function (err, resortList) {
//         console.log("Reading resorts from directory: " + dir);
//         if (err) {
//             console.log("ERROR getting resort json files from directory w/ msg:  " + err);
//         }
//         else {
//             callback(resortList);
//         }
//     });
// }
//
// getListOfFiles(dir, (resortList) => {
//     console.log("Reading from each file");
//     resortList.forEach(function(resort, index) {
//         fs.readFile(dir + "/" + resortList[index], function(err, data) {
//             var parsedData = JSON.parse(data);
//             var url = parsedData.url;
//             console.log("Call scraper now for: " + resort);
//             scrapeSite(url, resort, (data) => {
//                 if(data === "ERROR"){ console.log("Error trying to scrape: " + resort); }
//                 else {
//                     console.log("Data for: " + data.resort);
//                     console.log('data for overnight:' + data.type.overNightSnowFall);
//                     console.log(data);
//                 }
//             })
//         })
//     })
// });
var url = "https://www.missionridge.com/snow-report";
var resort = "mission ridge";
scrapeSite(url, resort, (data) => {
    if(data === "ERROR"){ console.log("Error trying to scrape: " + resort); }
    else {
        console.log("Data for: " + resort);
        //console.log('data for overnight:' + data.type.overNightSnowFall);
        console.log(data);
    }
})

function scrapeSite(parsedData, resort, callback) { //parsed data is url right now
    const options = {
        uri: parsedData,
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    console.log("Fetching data from site...");
    rp(options)
        .then(($) => {
            console.log("Data received");
            // var currentResort = "";
            // var stevensPass = {
            //     resort: "Stevens Pass",
            //     selectors: {
            //         reportDateUpdated: $('.page-report-snowfall-value').text(),
            //         overNightSnowFall: $($('.page-report-snowfall-value')[0]).text().slice(0, -1),
            //         snowFallOneDay: $($('.page-report-snowfall-value')[1]).text().slice(0, -1),
            //         snowFallTwoDay: $($('.page-report-snowfall-value')[2]).text().slice(0, -1),
            //         snowDepthBase: $($('.page-report-snowdepth-value')[0]).text().slice(0, -1),
            //         snowDepthMidMtn: $($('.page-report-snowdepth-value')[1]).text().slice(0, -1),
            //         seasonSnowFall: $($('.page-report-snowdepth-value')[2]).text().slice(0, -1)
            //     }
            // };
            //
            // var crystalMountain = {
            //     resort: "Crystal Mountain",
            //     selectors: { //TODO: UPDATE
            //         reportDateUpdated: "CRYSTAL",
            //         overNightSnowFall: $($('.page-report-snowfall-value')[0]).text().slice(0, -1),
            //         snowFallOneDay: $($('.page-report-snowfall-value')[1]).text().slice(0, -1),
            //         snowFallTwoDay: $($('.page-report-snowfall-value')[2]).text().slice(0, -1),
            //         snowDepthBase: $($('.page-report-snowdepth-value')[0]).text().slice(0, -1),
            //         snowDepthMidMtn: $($('.page-report-snowdepth-value')[1]).text().slice(0, -1),
            //         seasonSnowFall: $($('.page-report-snowdepth-value')[2]).text().slice(0, -1)
            //     }
            // };
            //
            // switch(resort) {
            //     case "stevens.json":
            //         currentResort = stevensPass;
            //         break;
            //     case "crystal.json":
            //         currentResort = crystalMountain;
            //         break;
            //     case "snoqualmie.json":
            //
            //     default:
            //         break;
            // }

            var data = { //these values are of alpental top and alpental, midmtn is from alpental top, rest are alpental
                reportDateUpdated: $('.bluebar-time').text().trim(),
                overNightSnowFall: $($('.weather.data-table .odd .data')[5]).text().slice(0,-1),
                snowFallOneDay: $($('.weather.data-table .even .data')[2]).text().slice(0,-1),
                snowFallTwoDay: $($('.weather.data-table .odd .data')[2]).text().slice(0,-1),
                snowDepthBase: $($('.weather.data-table .even .data')[11]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[11]).text().slice(0,-1),
                snowDepthMidMtn: $($('.weather.data-table .even .data')[9]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[9]).text().slice(0,-1),
                seasonSnowFall: "N/A"
            };
            callback(data);
        })
        .catch((err) => {
            console.log(err);
            callback("ERROR");
        });
};




