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

### WebScraper
Files to zip:
- AWS_Helpers.js
- Scraper.js
- package.json
- node_modules/
- resorts/

#### Adding New Resort
- Add resort file to `resorts/___.json`
- Add selectors to Scraper.js
- Add to weather report in index.js as well
- Add new slot values on Alexa Dashboard

# Testing
Use scraperTest.js to test that the web scraper selectors are working for each resort 

To test the Util functions locally:
- Open Integrated Terminal in VS Code
- Call functions that need to be tested from file
- Run `node fileName.js`
   - example `node utilsTest.js`


# TODO

Add: Big Sky, Heavenly, Jackson Hole, Squaw Valley, Vail, Whistler

- Rename lambda function

- Future:
-- Add better method of listing all resorts (ie: list 10, would you like to hear more, pagination effect)
--- Or have ability to say What resorts do you support in WA, CA, OR, etc and list out for specific states/regions
--- Add support for Canada, based on users region report depths in cm or inches