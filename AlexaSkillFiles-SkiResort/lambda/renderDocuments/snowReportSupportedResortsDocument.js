const snowReportSupportedResortsDocument = {
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
    "items": [
      {
        "type": "AlexaTextList",
        "headerTitle": "${payload.data.title}",
        "headerSubtitle": "${payload.data.subtitle}",
        "headerBackButton": false,
        "headerAttributionImage": "${payload.data.logoUrl}",
        "backgroundImageSource": "${payload.data.backgroundImage.sources[0].url}",
        "backgroundColorOverlay": true,
        "listItems": "${payload.data.listItems}",
        "touchForward": true,
        "hideDivider": true,
        "hideOrdinal": true,
        "id": "snowReportList"
      }
    ]
  }
};

  const snowReportSupportedResortsData = (supportedResortsList) => {
    const listItems = supportedResortsList.map(resort => ({primaryText: resort}));

    return {
    "type": "object",
    "objectId": "textListSample",
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
    "subtitle": "Supported Resorts",
    "listItems": listItems,
    "logoUrl": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.svg"
  };
};

module.exports = {
  snowReportSupportedResortsDocument: snowReportSupportedResortsDocument,
  snowReportSupportedResortsData: snowReportSupportedResortsData
};
