# Update Readme

# Deploy
Two packages to deploy 1. AlexaSkill 2. WebScraper

Zip files and upload to corresponding Lambda function

### AlexaSkill
Files to zip:
- AWS_Helpers
- index.js
- intents.json
- package.json
- node_modules/
- secrets/

### WebScraper
Files to zip:
- AWS_Helpers.js
- Scraper.js
- package.json
- node_modules/
- resorts/

#### Adding New Resort
- Add resort file to `resorts/___.json`
  - use link to OnTheSnow
- Validate selectors return data from Scraper.js
  - should not require changes
- Add weather report data
  - Add the gridpoint to utils - resortWeatherGridpoints
- Add resort name to the `getSupportedResorts()` util function
- Add new slot values and synonyms on Alexa Dashboard


# Weather API
Documentation for Weather.gov API:
https://www.weather.gov/documentation/services-web-api

To get a gridpoint to use for a new resort:
- Get the LAT, LON of the resort (just using google search)
- Build a URL w/ the lat and long
  - https://api.weather.gov/points/{latitude},{longitude}/forecast
  - Enter the url in the browser and it will convert the url to one containing `/gridpoints/{region}/{num1,numb2}/forecast
  - Copy this and use this in the code

_Note: This Weather API only supports regions in the USA._
# Testing

#### WebScraper
Use Scraper.js to test that the web scraper selectors are working for each resort 
Uncomment the line `executeWebScraper(false, "stevens.json");`. Pass in false (to not update DynamoDB Table) and the name of the resort file (ex: "stevens.json"). 

To test the Util functions locally:
- Open Integrated Terminal in VS Code
- Run `node Scraper.js`

#### Intents



# TODO

Look into how to use onthesnow api: http://docs.clientservice.onthesnow.com/docs/index.html
- If it works well, replace all the individual scraping with this

If going to continue scraping individual websites, need to look into possibly switching over to using Puppeteer.
Sites that load content dynamically don't work with Cheerio.

Add: Big Sky, Heavenly, Jackson Hole, Squaw Valley, and other tahoes resorts,  Vail, Whistler

- Rename lambda function

- Future:
-- Add better method of listing all resorts (ie: list 10, would you like to hear more, pagination effect)
--- Or have ability to say What resorts do you support in WA, CA, OR, etc and list out for specific states/regions
--- Add support for Canada, based on users region report depths in cm or inches