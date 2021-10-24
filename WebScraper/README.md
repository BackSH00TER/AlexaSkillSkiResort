## SnowReport WebScraper
This section contains the code to scrape websites / call APIs to get the snow report data and write to the DB.

## Lambda Endpoints
**Production:** function:scraperTest

## Deploying
- Files to zip:
  - AWS_Helpers.js
  - Scraper.js
  - package.json
  - node_modules/
  - resorts/
- Upload to corresponding lamda function

## Testing
- Deploy changes to `scraperTest` lambda function
- Run a test on Lambda
- Look at the console logs returned and check the DynamoDB table to see if data was recorded correctly

Use Scraper.js to test that the web scraper selectors are working for each resort 
Uncomment the line `executeWebScraper(false, "stevens.json");`. Pass in false (to not update DynamoDB Table) and the name of the resort file (ex: "stevens.json"). 

To test the Util functions locally:
- Open Integrated Terminal in VS Code
- Run `node Scraper.js`

## Implementation
Currently the snow report information is gathered using the OnTheSnow API. Each resort as a `onTheSnowResortId` in the corresponding JSON file.

