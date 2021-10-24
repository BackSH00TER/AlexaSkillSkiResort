## Developing
While testing out changes in development
- update the Snow Report dev version lambda endpoint to point to `skiResortDev` function
- upload zipped package to skiResortDev Lambda function

## Lambda Endpoints
**Production:** arn:aws:lambda:us-east-1:268293220984:function:skiResortInfo
**Development:** arn:aws:lambda:us-east-1:268293220984:function:skiResortDev

## Deploying
- Delete node_modules/ and run `npm install --only=prod`
  - this is necessary to make sure we dont have devDependencies installed in `node_modules/`. Makes sure package size stays small.
- Zip all files in the `lambda/` path
- Upload to corresponding lamda function
- Once ready to go to production, don't forget to change the endpoint to point to `skiResortInfo` in the Alexa Developer Console

## Testing
- Deploy changes to `skiResortDev` lambda function
- Run a test on Lambda itself by passing a intent to call it. This allows you to see the response as well as **console logs**
- Test through Alexa Developer Console (ideal for general testing and testing the visual output)
- Test through VS Code Alexa Simulator extension
