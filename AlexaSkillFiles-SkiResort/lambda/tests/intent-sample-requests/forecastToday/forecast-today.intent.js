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
		"type": "IntentRequest",
		"requestId": "requestId123",
		"timestamp": "2021-03-20T19:03:54Z",
		"locale": "en-US",
		"intent": {
			"name": "forecastToday",
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
