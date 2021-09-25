
Refactoring the skill from alexa-sdk (v1) to ask-sdk (v2)

**NOTE: Don't forget to reset the endpoint id (skiResortInfo) back to the production version when it comes time to publishing**


To test the changes:
- Bundle and deploy the changes
- Upload to skiResortDev lambda function
  - Run a test on Lambda itself by passing a intent to call it. This allows you to see the response as well as **console logs**
  - Test through VS Code Alexa Simulutor extension or from the Web console (won't be able to see console logs)
    - Either way should work for testing once add visual outputs as well

Zipping files:
  - Should just zip all the files in the lambda/ path