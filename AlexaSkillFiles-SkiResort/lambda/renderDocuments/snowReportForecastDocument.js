/**
 * Returns object to render the APL document
 */  
const snowReportForecastDocument = {
  "type": "APL",
  "version": "1.8",
  "license": "Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0\nLicensed under the Amazon Software License  http://aws.amazon.com/asl/",
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
    "items": [
      {
        "type": "AlexaDetail",
        "headerTitle": "${payload.data.title}",
        "headerSubtitle": "${payload.data.subtitle}",
        "headerAttributionImage": "${payload.data.logoUrl}",
        "imageSource": "${payload.data.image.sources[0].url}",
        "imageShadow": false,
        "primaryText": "${payload.data.textContent.primaryText.text}",
        "secondaryText": "${payload.data.textContent.secondaryText.text}",
        "bodyText": "${payload.data.textContent.bodyText.text}",
        "backgroundImageSource": "${payload.data.backgroundImage.sources[0].url}",
        "theme": "dark",
        "detailType": "generic",
        "imageAspectRatio": "square",
        "imageScale": "fill",
        "detailImageAlignment": "right",
        "imageAlignment": "right",
        "backgroundColorOverlay": true,
        "id": "snowReportForecast"
      }
    ]
  },
  "layouts": {}
};

/**
 * Returns object containing all the data needed by the APL document for Forecast intents
 */ 
const snowReportForecastData = ({subtitle, resortName, iconUrl, tempHigh, tempLow, forecastDetail, showAsError}) => {
  let primaryText = `${tempHigh !== "N/A" ? `High: ${tempHigh}° F <br />` : ''} Low: ${tempLow}° F`;
  if (showAsError) {
    primaryText = "Sorry, something went wrong.";
  }

  return {
    "type": "object",
    "objectId": "detailImageRightSample",
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
    "title": "Snow Report",
    "subtitle": `${subtitle}: ${resortName}`,
    "image": {
      "contentDescription": "",
      "smallSourceUrl": null,
      "largeSourceUrl": null,
      "sources": [
        {
          "url": `${iconUrl}`,
          "size": "large"
          }
      ]
    },
    "textContent": {
      "primaryText": {
        "type": "PlainText",
        "text": primaryText
      },
      "secondaryText": {
        "type": "PlainText",
        "text": ""
      },
      "bodyText": {
        "type": "PlainText",
        "text": `${forecastDetail}`
      }
    },
    "logoUrl": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.png"
  }
};

/**
 * Returns object containing all the data needed by the APL document for Snow Report intents
 */ 
const snowReportData = ({subtitle, resortName, iconUrl, primaryText, secondaryText, bodyText}) => {
  return {
    "type": "object",
    "objectId": "detailImageRightSample",
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
    "title": "Snow Report",
    "subtitle": `${subtitle}: ${resortName}`,
    "image": {
      "contentDescription": "",
      "smallSourceUrl": null,
      "largeSourceUrl": null,
      "sources": [
        {
          "url": `${iconUrl}`,
          "size": "large"
          }
      ]
    },
    "textContent": {
      "primaryText": {
        "type": "PlainText",
        "text": primaryText
      },
      "secondaryText": {
        "type": "PlainText",
        "text": ""
      },
      "bodyText": {
        "type": "PlainText",
        "text": bodyText
      }
    },
    "logoUrl": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.png"
  }
};

module.exports = {
  snowReportForecastDocument: snowReportForecastDocument,
  snowReportForecastData: snowReportForecastData,
  snowReportData: snowReportData
};
