const { getIconUrl } = require("../utils");

const snowReportWeekForecastDocument = {
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
    "AlexaImageList": {
      "parameters": [
        {
            "name": "theme",
            "description": "Colors will be swiched depend on the specified theme (light/dark). Default to dark theme",
            "type": "string",
            "default": "dark"
        },
        {
            "name": "headerAttributionOpacity",
            "type": "number",
            "default": "${@viewportProfileCategory == @hubRound ? 1 : @opacitySecondary}"
        },
        {
            "name": "headerTitle",
            "description": "Primary text to render in header.",
            "type": "string"
        },
        {
            "name": "headerSubtitle",
            "description": "Secondary text to render in header.",
            "type": "string"
        },
        {
            "name": "headerAttributionText",
            "description": "Attribution text to render in header. Only shown when no headerAttributionImage is provided, and when headerAttributionPrimacy is true, or on a device that shows Title/Subtitle and Attribution.",
            "type": "string"
        },
        {
            "name": "headerAttributionImage",
            "description": "URL for attribution image source. Only shown when headerAttributionPrimacy is true, or on a device that shows Title/Subtitle and Attribution.",
            "type": "string"
        },
        {
            "name": "headerAttributionPrimacy",
            "description": "On devices that can only display one element due to screen size, Attribution is prioritized. Setting False displays Title/Subtitle.  Defaults to true.",
            "type": "boolean",
            "default": true
        },
        {
            "name": "headerDivider",
            "description": "Toggle to display the divider that appears at the bottom of header to help separate it from the content below. Default to false",
            "type": "boolean",
            "default": false
        },
        {
            "name": "headerBackButton",
            "description": "Toggle to display back button in header. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "headerBackButtonAccessibilityLabel",
            "description": "An accessibility label to describe the back button to customers who use a screen reader.",
            "type": "string"
        },
        {
            "name": "headerBackButtonCommand",
            "description": "Command that is issued when back button is pressed.",
            "type": "any",
            "default": {
                "type": "SendEvent",
                "arguments": [
                    "goBack"
                ]
            }
        },
        {
            "name": "headerBackgroundColor",
            "description": "Optional color value to use as background color for Header. Defaults to transparent.",
            "type": "color",
            "default": "transparent"
        },
        {
            "name": "hintText",
            "type": "string",
            "description": "Hint text to display in Footer."
        },
        {
            "name": "backgroundColor",
            "description": "Color value to use as background color for layout.",
            "type": "color"
        },
        {
            "name": "backgroundImageSource",
            "description": "URL for background image source.",
            "type": "string"
        },
        {
            "name": "backgroundVideoSource",
            "description": "URL for background video source.",
            "type": "any"
        },
        {
            "name": "backgroundScale",
            "description": "Image/video scale to apply to background image/video. Defaults to best-fill.",
            "type": "string",
            "default": "best-fill"
        },
        {
            "name": "backgroundAlign",
            "description": "Image/video alignment to apply to background image/video. Defaults to center.",
            "type": "string",
            "align": "center"
        },
        {
            "name": "backgroundBlur",
            "description": "Toggle to apply background blur. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "backgroundColorOverlay",
            "description": "Toggle to apply overlay scrim to background image/video. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "backgroundOverlayGradient",
            "description": "Toggle to apply gradient to background image/video. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "videoAutoPlay",
            "description": "Toggle to autoplay background video(s). Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "videoAudioTrack",
            "description": "Audio track to play on. Defaults to foreground. EM can select foreground | background | none.",
            "type": "string",
            "default": "foreground"
        },
        {
            "name": "listItems",
            "description": "The Items will be displayed in the list.",
            "type": "array"
        },
        {
            "name": "imageMetadataPrimacy",
            "description": "ImageMetadataPrimacy on devices that can only display one element due to screen size, Image's secondary and tertiary text is prioritized over hint text. Setting false displays hint text. Defaults to true",
            "type": "boolean",
            "default": true
        },
        {
            "name": "hideOrdinal",
            "description": "Toggle to hide ordinal in list item. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "imageHideScrim",
            "description": "Toggle to hide the overlay (scrim) between image and content to increase content readability. Defaults to false.",
            "type": "boolean",
            "default": false
        },
        {
            "name": "imageHeight",
            "description": "Dimension value to set image height",
            "type": "dimension"
        },
        {
            "name": "imageAspectRatio",
            "description": "Aspect ratio of the image. Options are square, round, standard_landscape, standard_portrait, poster_landscape, poster_portrait, widescreen. Default to square",
            "type": "string",
            "default": "square"
        },
        {
            "name": "imageScale",
            "description": "Scale setting for the image. Options are none, fill, best-fit, best-fill, best-fit-down. Default to best-fit",
            "type": "string",
            "default": "best-fit"
        },
        {
            "name": "imageAlignment",
            "description": "Alignment setting for the image. Options are bottom, bottom-left, bottom-right, center, left, right, top, top-left, top-right. Default to center",
            "type": "string",
            "default": "center"
        },
        {
            "name": "imageRoundedCorner",
            "description": "Whether to use rounded corners for the image",
            "type": "boolean",
            "default": true
        },
        {
            "name": "imageBlurredBackground",
            "description": "Set a blurred version of the image to appear behind the image to create a visually consistent container size",
            "type": "boolean",
            "default": false
        },
        {
            "name": "imageShowProgressBar",
            "description": "Toggle to display the progress bar on the image overlay. The progress bar will be displayed if imageProgressBarPercentage parameter is defined. Defaults to true.",
            "type": "boolean",
            "default": true
        },
        {
            "name": "defaultImageSource",
            "description": "URI for the default image on the list item so the image containers are never empty",
            "type": "string"
        },
        {
            "name": "primaryAction",
            "description": "The action that is triggered when the item is selected.",
            "type": "any"
        },
        {
            "name": "entities",
            "description": "Array of entity data bind to this layout",
            "type": "any"
        },
        {
            "name": "listId",
            "type": "string",
            "default": "AlexaImageListSequence",
            "description": "The component id for the scrolling list in this layout"
        },
        {
            "name": "speechItems",
            "description": "Array of speech items",
            "type": "any"
        },
        {
            "name": "imageShadow",
            "description": "Boolean to turn the drop shadow on or off on the image",
            "type": "boolean",
            "default": true
        },
        {
            "name": "layoutDirection",
            "description": "The layoutDirection of AlexaImageList. It can be LTR or RTL. By default, it uses environment layoutDirection.",
            "type": "string",
            "default": "${environment.layoutDirection}"
        },
        {
            "name": "lang",
            "description": "The lang property of AlexaImageList. Set the lang property to a BCP-47 string (e.g., en-US). By default, it uses environment lang.",
            "type": "string",
            "default": "${environment.lang}"
        }
      ],
      "items": [
          {
              "type": "Container",
              "width": "100%",
              "height": "100%",
              "entities": "${entities}",
              "layoutDirection": "${layoutDirection}",
              "items": [
                  {
                      "type": "AlexaBackground",
                      "backgroundColor": "${backgroundColor}",
                      "backgroundImageSource": "${backgroundImageSource}",
                      "backgroundVideoSource": "${backgroundVideoSource}",
                      "backgroundScale": "${backgroundScale}",
                      "backgroundAlign": "${backgroundAlign}",
                      "backgroundBlur": "${backgroundBlur}",
                      "colorOverlay": "${backgroundColorOverlay}",
                      "overlayGradient": "${backgroundOverlayGradient}",
                      "videoAutoPlay": "${backgroundVideoAutoPlay}",
                      "videoAudioTrack": "${backgroundVideoAudioTrack}"
                  },
                  {
                      "type": "AlexaHeader",
                      "theme": "${theme}",
                      "headerTitle": "${headerTitle}",
                      "headerSubtitle": "${headerSubtitle}",
                      "headerAttributionText": "${headerAttributionText}",
                      "headerAttributionImage": "${headerAttributionImage}",
                      "headerAttributionPrimacy": "${headerAttributionPrimacy}",
                      "headerDivider": "${headerDivider && @viewportProfile != @tvLandscapeOverlay}",
                      "headerBackButton": "${headerBackButton}",
                      "headerBackButtonCommand": "${headerBackButtonCommand}",
                      "headerBackgroundColor": "${headerBackgroundColor}",
                      "headerAttributionOpacity": "${headerAttributionOpacity}",
                      "layoutDirection": "${layoutDirection}",
                      "position": "${@viewportProfile == @tvLandscapeOverlay ? 'absolute' : 'relative'}",
                      "width": "100%"
                  },
                  {
                      "shrink": 1,
                      "items": [
                          {
                              "data": "${listItems}",
                              "scrollDirection": "@imageListScrollDirection",
                              "snap": "none",
                              "item": {
                                  "type": "AlexaImageListItem",
                                  "theme": "${theme}",
                                  "colorSecondaryText": "white",
                                  "accessibilityLabel": "${data.accessibilityLabel}",
                                  "imageAltText": "${data.imageAltText}",
                                  "hideOrdinal": "${hideOrdinal}",
                                  "primaryText": "${data.primaryText}",
                                  "secondaryText": "${data.secondaryText}",
                                  "tertiaryText": "${data.tertiaryText}",
                                  "ratingSlotMode": "${data.ratingSlotMode}",
                                  "ratingGraphicType": "${data.ratingGraphicType}",
                                  "ratingNumber": "${data.ratingNumber}",
                                  "singleRatingGraphic": "${data.singleRatingGraphic}",
                                  "fullRatingGraphic": "${data.fullRatingGraphic}",
                                  "halfRatingGraphic": "${data.halfRatingGraphic}",
                                  "emptyRatingGraphic": "${data.emptyRatingGraphic}",
                                  "ratingText": "${data.ratingText}",
                                  "hasPlayIcon": "${data.hasPlayIcon}",
                                  "providerText": "${data.providerText}",
                                  "imageSource": "${data.imageSource ? data.imageSource : defaultImageSource}",
                                  "imageProgressBarPercentage": "${data.imageProgressBarPercentage}",
                                  "imageHideScrim": "${data.imageHideScrim ? data.imageHideScrim : imageHideScrim}",
                                  "imageRoundedCorner": "${data.imageRoundedCorner ? data.imageRoundedCorner : imageRoundedCorner}",
                                  "imageScale": "${data.imageScale ? data.imageScale : imageScale}",
                                  "imageAlignment": "${data.imageAlignment ? data.imageAlignment : imageAlignment}",
                                  "imageAspectRatio": "${imageAspectRatio}",
                                  "imageBlurredBackground": "${data.imageBlurredBackground ? data.imageBlurredBackground : imageBlurredBackground}",
                                  "imageMetadataPrimacy": "${imageMetadataPrimacy}",
                                  "imageShadow": "${data.imageShadow ? data.imageShadow : imageShadow}",
                                  "primaryAction": "${data.primaryAction ? data.primaryAction : primaryAction}",
                                  "speech": "${speechItems[index].speech}",
                                  "entities": "${data.entities ? data.entities : entities}",
                                  "contentDirection": "${@viewportProfile == @tvLandscapeOverlay || @viewportProfile == @hubPortraitMedium || (@viewportProfileGroup == @mobile && @viewportOrientation == @viewportOrientationPortrait) ? 'row' : 'column'}",
                                  "layoutDirection": "${layoutDirection}",
                                  "singleRatingGraphicWidth": "${data.singleRatingGraphicWidth}",
                                  "imageHeight": "15vw",
                                  "imageWidth": "15vw",
                                  "imageShowProgressBar": "${data.imageShowProgressBar ? data.imageShowProgressBar : imageShowProgressBar}",
                                  "disabled": "${data.disabled}"
                              },
                              "type": "Sequence",
                              "id": "${listId}",
                              "width": "100%",
                              "height": "100%",
                              "paddingLeft": "@imageListPaddingLeft",
                              "paddingRight": "@imageListPaddingRight",
                              "paddingTop": "@imageListPaddingTop",
                              "alignSelf": "center",
                              "shrink": 1
                          }
                      ],
                      "justifyContent": "@imageListJustifyContent",
                      "numbered": false,
                      "type": "Container",
                      "width": "100%",
                      "height": "100vh",
                      "paddingBottom": "0",
                      "top": "${@viewportProfile == @tvLandscapeOverlay ? '42dp' : 'auto'}"
                  },
                  {
                      "when": "${hintText && (@viewportProfile == @hubLandscapeMedium || @viewportProfile == @hubLandscapeLarge || @viewportProfile == @tvLandscapeXLarge || (!imageMetadataPrimacy && @viewportProfile == @hubLandscapeSmall))}",
                      "theme": "${theme}",
                      "type": "AlexaFooter",
                      "hintText": "${hintText}",
                      "lang": "${lang}"
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
        "type": "AlexaImageList",
        "headerTitle": "${payload.data.title}",
        "headerSubtitle": "${payload.data.subtitle}",
        "headerAttributionImage": "${payload.data.logoUrl}",
        "backgroundImageSource": "${payload.data.backgroundImage.sources[0].url}",
        "imageAspectRatio": "square",
        "imageMetadataPrimacy": true,
        "imageScale": "fill",
        "listItems": "${payload.data.listItems}",
        "hintText": "${payload.data.hintText}",
        "theme": "dark",
        "hideOrdinal": true,
        "backgroundColorOverlay": true,
        "id": "plantList"
      }
    ]
  }
};
    
const snowReportWeekForecastData = ({subtitle, resortName, forecastData}) => {
  const listItems = forecastData.map((forecast) => {
    console.log('forecast item: ', forecast.day, forecast)
    return {
      primaryText: forecast.day,
      secondaryText: `H: ${forecast.tempHigh}°F | L: ${forecast.tempLow}°F`,
      imageSource: getIconUrl({iconUrlFromWeatherAPI: forecast.iconUrl}),
      imageScale: "fill"
    };
  });
  
  return {
    "type": "object",
    "objectId": "imageListSample",
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
    "listItems": listItems,
    "logoUrl": "https://snowreportskill-assets.s3.amazonaws.com/skiresort-logo.png",
    "hintText": "Try, \"Alexa, what is the snow report for Stevens pass?\""
  };
}

module.exports = {
  snowReportWeekForecastDocument: snowReportWeekForecastDocument,
  snowReportWeekForecastData: snowReportWeekForecastData
};
