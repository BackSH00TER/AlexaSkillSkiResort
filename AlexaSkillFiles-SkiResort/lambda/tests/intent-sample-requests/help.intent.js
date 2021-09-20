const { AlexaAppId } = require('../../secrets/credentials');

module.exports = {
	"version": "1.0",
	"session": {
		"new": false,
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
		"timestamp": "2021-09-11T23:48:38Z",
		"intent": {
			"name": "AMAZON.HelpIntent",
			"confirmationStatus": "NONE"
		}
	}
}