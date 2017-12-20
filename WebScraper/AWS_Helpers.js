var AWS = require("aws-sdk");

AWS.config.update({
    //Web service
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"

    //Local
    // region: "us-west-2",
    // endpoint: "http://localhost:8000"
});

var docClient = new AWS.DynamoDB.DocumentClient()

module.exports = {
    //Used to retrieve data from DynamoDB about the requested resort
    //Mainly used by Alexa Skill lambda function to request data
    getData: function(params, callback) {
        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to read from resort: " + params.Key.resort + ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                callback(data);
            }
        });
    },

    //Used to put updated data to DynamoDB about the given resort
    //Mainly used by the scraper lambda skill to update information periodically
    putData: function(params, callback) {
        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add Stevens Pass data. Error JSON:", JSON.stringify(err, null, 2));
                callback("FAILED");
            } else {
                callback("SUCCESS");
            }
        });
    },

    //Used to update atomic counters for resorts called
    updateResortCount: function(params, callback) {
        docClient.update(params, function(err, data) {
            if(err) {
                console.error("Error updating count for: " + params.Key.resort);
                callback("ERROR");
            }
            else {
                callback("SUCCESS");
            }
        })
    }
};


