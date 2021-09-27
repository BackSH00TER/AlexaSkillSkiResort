const { AlexaAppId } = require('../../lambda/secrets/credentials');

module.exports = {
	"version": "1.0",
	"session": {
		"new": true,
		"sessionId": "sessionId123",
    "application": {
      "applicationId": AlexaAppId
    },
    "attributes": {},
    "user": {
      "userId": "userId123"
    }
	},
	"request": {
		"type": "IntentRequest",
		"requestId": "requestId123",
    "locale": "en-US",
		"timestamp": "2021-09-11T23:18:02Z",
		"intent": {
			"name": "supportedResorts",
			"confirmationStatus": "NONE"
		}
	}
}