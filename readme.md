# Snow Report
Code base for Snow Report Alexa Skill. 

There are two sections to this skill: the Alexa Skill code and the WebScraper code. Each is deployed to their own lambda function.
Reference respective README's for developing, testing, deploying info.

The WebScraper lambda function is setup to run automatically with a cronjob and updates the database with the information.

## Adding New Resort
#### AlexaSkill
- Add support for Weather report data
  - In utils.js
    - add the new gridpoint for the resort to `resortWeatherGridpoints`
    - add the new resort to the array returned by `getSupportedResorts()`
- In the Alexa Developer Console, add the new slot value and synonyms
#### WebScraper
- Add resort file to `resorts/___.json`
- Validate selectors return data from Scraper.js
  - should not require changes

## Weather API
Documentation for Weather.gov API:
https://www.weather.gov/documentation/services-web-api

To get a gridpoint to use for a new resort:
- Get the LAT, LON of the resort (just using google search)
- Build a URL w/ the lat and long
  - https://api.weather.gov/points/{latitude},{longitude}/forecast
  - Enter the url in the browser and it will convert the url to one containing `/gridpoints/{region}/{num1,numb2}/forecast
  - Copy this and use this in the code

For potential alerts on outages/issues with the Weather API:
- https://github.com/weather-gov/api
- https://www.nco.ncep.noaa.gov/status/messages/

_Note: This Weather API only supports regions in the USA._

# Testing
Once code is ready to test, upload it to the "dev" lambda function (skiResortDev)
Then in the Alexa console go to Build -> Endpoint and switch the endpoint to `arn:aws:lambda:us-east-1:268293220984:function:skiResortDev`

If the changes are good to go, deploy the changes to the "prod" lambda function (skiResortInfo)
Then in Alexa console make sure to reset the endpoint to `arn:aws:lambda:us-east-1:268293220984:function:skiResortInfo` for the In Development skill


# TODO

Add: Big Sky, Heavenly, Jackson Hole, Squaw Valley, and other tahoes resorts,  Vail, Whistler


- Future:
  - Add better method of listing all resorts (ie: list 10, would you like to hear more, pagination effect)
    - Or have ability to say What resorts do you support in WA, CA, OR, etc and list out for specific states/regions
  - Add support for Canada, based on users region report depths in cm or inches
  - Add forecasted snow amounts