const snowReportHeadlineDocument = {
  "type": "APL",
  "version": "1.8",
  "license": "Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0\nLicensed under the Amazon Software License  http://aws.amazon.com/asl/",
  "theme": "dark",
  "import": [
    {
      "name": "alexa-layouts",
      "version": "1.4.0"
    }
  ],
  "mainTemplate": {
    "parameters": [
      "payload"
    ],
    "item": [
      {
        "type": "AlexaHeadline",
        "primaryText": "${payload.data.properties.textContent.primaryText.text}",
        "headerAttributionImage": "${payload.data.properties.logoUrl}",
        "headerAttributionPrimacy": true,
        "footerHintText": "${payload.data.properties.hintText}",
        "backgroundImageSource": "${payload.data.properties.backgroundImage.sources[0].url}",
        "headerTitle": "Snow Report",
        "backgroundColorOverlay": true,
        "id": "PlantHeadline"
      }
    ]
  }
};

const snowReportHeadlineData = {
  "type": "object",
  "objectId": "headlineSample",
  "properties": {
    "backgroundImage": {
      "contentDescription": null,
      "smallSourceUrl": null,
      "largeSourceUrl": null,
      "sources": [
        {
          "url": "https://snowreportskill-assets.s3.amazonaws.com/mountain-range.jpg",
          "size": "large"
        }
      ]
    },
    "textContent": {
      "primaryText": {
        "type": "PlainText",
        "text": "Welcome to Snow Report"
      }
    },
    "logoUrl": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.svg",
    "hintText": "Try, \"Alexa, what is the snow report for Mission Ridge?\""
  }
};

module.exports = {
  snowReportHeadlineDocument: snowReportHeadlineDocument,
  snowReportHeadlineData: snowReportHeadlineData
};