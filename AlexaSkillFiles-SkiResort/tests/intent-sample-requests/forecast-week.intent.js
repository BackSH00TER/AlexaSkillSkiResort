const { AlexaAppId } = require('../../lambda/secrets/credentials');

module.exports = {
  "version": "1.0",
  "session": {
    "new": true,
    "sessionId": "sessionId123",
    "application": {
      "applicationId": AlexaAppId
    },
    "user": {
      "userId": "userId123"
    }
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "requestId123",
    "locale": "en-US",
    "timestamp": "2021-03-29T03:48:58Z",
    "intent": {
      "name": "forecastWeek",
      "confirmationStatus": "NONE",
      "slots": {
        "Resort": {
          "name": "Resort",
          "value": "Stevens pass",
          "resolutions": {
            "resolutionsPerAuthority": [
              {
                "authority": "authorityID.LIST_OF_RESORTS",
                "status": {
                  "code": "ER_SUCCESS_MATCH"
                },
                "values": [
                  {
                    "value": {
                      "name": "Stevens Pass",
                      "id": "Stevens_Pass"
                    }
                  }
                ]
              }
            ]
          },
          "confirmationStatus": "NONE",
          "source": "USER",
          "slotValue": {
            "type": "Simple",
            "value": "Stevens pass",
            "resolutions": {
              "resolutionsPerAuthority": [
                {
                  "authority": "authorityID.LIST_OF_RESORTS",
                  "status": {
                    "code": "ER_SUCCESS_MATCH"
                  },
                  "values": [
                    {
                      "value": {
                        "name": "Stevens Pass",
                        "id": "Stevens_Pass"
                      }
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
  }
};