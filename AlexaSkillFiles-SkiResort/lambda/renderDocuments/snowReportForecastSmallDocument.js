const { getIconUrl } = require("../utils");

const snowReportForecastSmallDocument = {
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
  "layouts": {
    "PaginatedListItem": {
      "parameters": [
          {
              "name": "primaryText",
              "description": "Title, likely is the Day value",
              "type": "string"
          },
          {
              "name": "tempHigh",
              "description": "High temperature",
              "type": "string"
          },
          {
              "name": "tempLow",
              "description": "Low temperature",
              "type": "string"
          },
          {
              "name": "iconUrl",
              "description": "The URL for the waether icon",
              "type": "string"
          }
      ],
      "item": [
        {
          "item": [
            {
                "type": "AlexaBackground",
                "backgroundImageSource": "https://snowreportskill-assets.s3.amazonaws.com/mountain-range.jpg",
                "colorOverlay": true
            },
            {
                "text": "${primaryText}",
                "fontSize": "40dp",
                "textAlign": "center",
                "textAlignVertical": "auto",
                "type": "Text",
                "width": "300dp",
                "height": "32dp",
                "paddingTop": "50dp",
                "paddingBottom": "12dp"
            },
            {
                "source": "${iconUrl}",
                "scale": "best-fit-down",
                "align": "center",
                "type": "Image",
                "width": "300dp",
                "height": "200dp",
                "paddingTop": "50dp"
            },
            {
                "text": "${tempHigh} <br/> ${tempLow}",
                "fontSize": "40dp",
                "color": "#FFFFFF",
                "textAlign": "center",
                "textAlignVertical": "bottom",
                "type": "Text",
                "width": "300dp",
                "height": "32dp",
                "paddingTop": "12dp",
                "paddingBottom": "12dp"
            },
            {
                "source": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.svg",
                "scale": "best-fit-down",
                "align": "bottom",
                "type": "Image",
                "width": "70dp",
                "height": "200dp"
            }
          ],
          "alignItems": "center",
          "type": "Container",
          "id": "forecast",
          "width": "100%",
          "height": "100%"
        }
      ]
    },
    "PaginatedList": {
      "parameters": [
          {
              "name": "listItems",
              "description": "Array of list items to present"
          }
      ],
      "items": [
        {
          "type": "Container",
          "width": "100%",
          "height": "100%",
          "items": [
            {
                "navigation": "normal",
                "data": "${listItems}",
                "item": [
                    {
                        "type": "TouchWrapper",
                        "width": "100%",
                        "height": "100%",
                        "onPress": "${data.primaryAction ? data.primaryAction : primaryAction}",
                        "item": [
                            {
                                "type": "Container",
                                "alignItems": "center",
                                "width": "100%",
                                "height": "100%",
                                "item": [
                                    {
                                        "type": "PaginatedListItem",
                                        "primaryText": "${data.primaryText}",
                                        "tempHigh": "${data.tempHigh}",
                                        "tempLow": "${data.tempLow}",
                                        "iconUrl": "${data.iconUrl}"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "onPageChanged": [
                    {
                        "type": "SetValue",
                        "componentId": "PageCounterComponentId",
                        "property": "text",
                        "value": "${event.source.value + 1}"
                    }
                ],
                "type": "Pager",
                "id": "${listId}",
                "width": "100%",
                "height": "100%",
                "position": "absolute",
                "bottom": "0"
            },
            {
                "when": "${listItems.length > 1}",
                "currentPageComponentId": "PageCounterComponentId",
                "totalPages": "${listItems.length}",
                "type": "AlexaPageCounter",
                "position": "absolute",
                "justifyContent": "@paginatedListPageCounterAlignment",
                "paddingLeft": "@pageCounterPaddingLeft",
                "theme": "${theme}",
                "bottom": "@paginatedListPageCounterPaddingBottom",
                "width": "100%"
            }
          ]
        }
      ]
    }
  },
  "mainTemplate": {
    "parameters": [
      "payload"
    ],
    "items": [
      {
        "type": "PaginatedList",
        "listItems": "${payload.data.listItems}"
      }
    ]
  }
};

const snowReportForecastSmallData = ({subtitle, resortName, forecastData}) => {
  // forecastData could be an array or an object. If its being passed in from forecastWeek it will be an array,
  // otherwise it will be an object. Either way the listItems will be returned as an array.
  let listItems;
  if (Array.isArray(forecastData)) {
    // Handles the case where forecastData is an array
    listItems = forecastData.map((forecast) => {
      console.log('forecast item: ', forecast.day, forecast)
      return {
        primaryText: forecast.day,
        tempHigh: `High: ${forecast.tempHigh}°F`,
        tempLow: `Low: ${forecast.tempLow}°F`,
        iconUrl: getIconUrl({iconUrlFromWeatherAPI: forecast.iconUrl}),
        imageScale: "fill"
      };
    });
  } else {
    // Handles the case where forecastData is an object for one day, and returns an array of one
    listItems = [{
      primaryText: forecastData.day,
      tempHigh: forecastData.tempHigh !== "N/A" ? `High: ${forecastData.tempHigh}°F` : '', // Could be N/A if its night for that day
      tempLow: `Low: ${forecastData.tempLow}°F`,
      iconUrl: getIconUrl({iconUrlFromWeatherAPI: forecastData.iconUrl}),
      imageScale: "fill"
    }];
  }

  return {
    "type": "object",
    "listItems": listItems
  };
};

module.exports = {
  snowReportForecastSmallDocument: snowReportForecastSmallDocument,
  snowReportForecastSmallData: snowReportForecastSmallData
};
