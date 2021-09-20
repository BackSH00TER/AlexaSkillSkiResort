const { AlexaAppId } = require('../../../secrets/credentials');

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
		"type": "LaunchRequest",
		"requestId": "requestId123",
		"timestamp": "2021-03-20T19:03:54Z",
		"locale": "en-US",
		"shouldLinkResultBeReturned": false
	}
};
