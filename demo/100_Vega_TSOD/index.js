const loadName = window.location.search.split('file=')[1].split('&')[0];

const spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "Area charts of stock Closes, with an interactive overview and filtered detail views.",
  "width": 720,
  "height": 480,
  "padding": 5,

  "data": [
    {
      "name": "sp500",
      "url": "data/stocks/" + loadName,
      "format": { "type": "csv", "parse": { "Close": "number", "Date": "date" } }
    }
  ],

  "signals": [
    {
      "name": "detailDomain"
    }
  ],

  "marks": [
    {
      "type": "group",
      "name": "detail",
      "encode": {
        "enter": {
          "height": { "value": 390 },
          "width": { "value": 720 }
        }
      },
      "scales": [
        {
          "name": "xDetail",
          "type": "time",
          "range": "width",
          "domain": { "data": "sp500", "field": "Date" },
          "domainRaw": { "signal": "detailDomain" }
        },
        {
          "name": "yDetail",
          "type": "linear",
          "range": [390, 0],
          "domain": { "data": "sp500", "field": "Close" },
          "nice": true, "zero": true
        }
      ],
      "axes": [
        { "orient": "bottom", "scale": "xDetail" },
        { "orient": "left", "scale": "yDetail" }
      ],
      "marks": [
        {
          "type": "group",
          "encode": {
            "enter": {
              "height": { "field": { "group": "height" } },
              "width": { "field": { "group": "width" } },
              "clip": { "value": true }
            }
          },
          "marks": [
            {
              "type": "area",
              "from": { "data": "sp500" },
              "encode": {
                "update": {
                  "x": { "scale": "xDetail", "field": "Date" },
                  "y": { "scale": "yDetail", "field": "Close" },
                  "y2": { "scale": "yDetail", "value": 0 },
                  "fill": { "value": "steelblue" }
                }
              }
            }
          ]
        }
      ]
    },

    {
      "type": "group",
      "name": "overview",
      "encode": {
        "enter": {
          "x": { "value": 0 },
          "y": { "value": 430 },
          "height": { "value": 70 },
          "width": { "value": 720 },
          "fill": { "value": "transparent" }
        }
      },
      "signals": [
        {
          "name": "brush", "value": 0,
          "on": [
            {
              "events": "@overview:mousedown",
              "update": "[x(), x()]"
            },
            {
              "events": "[@overview:mousedown, window:mouseup] > window:mousemove!",
              "update": "[brush[0], clamp(x(), 0, width)]"
            },
            {
              "events": { "signal": "delta" },
              "update": "clampRange([anchor[0] + delta, anchor[1] + delta], 0, width)"
            }
          ]
        },
        {
          "name": "anchor", "value": null,
          "on": [{ "events": "@brush:mousedown", "update": "slice(brush)" }]
        },
        {
          "name": "xdown", "value": 0,
          "on": [{ "events": "@brush:mousedown", "update": "x()" }]
        },
        {
          "name": "delta", "value": 0,
          "on": [
            {
              "events": "[@brush:mousedown, window:mouseup] > window:mousemove!",
              "update": "x() - xdown"
            }
          ]
        },
        {
          "name": "detailDomain",
          "push": "outer",
          "on": [
            {
              "events": { "signal": "brush" },
              "update": "span(brush) ? invert('xOverview', brush) : null"
            }
          ]
        }
      ],
      "scales": [
        {
          "name": "xOverview",
          "type": "time",
          "range": "width",
          "domain": { "data": "sp500", "field": "Date" }
        },
        {
          "name": "yOverview",
          "type": "linear",
          "range": [70, 0],
          "domain": { "data": "sp500", "field": "Close" },
          "nice": true, "zero": true
        }
      ],
      "axes": [
        { "orient": "bottom", "scale": "xOverview" }
      ],
      "marks": [
        {
          "type": "area",
          "interactive": false,
          "from": { "data": "sp500" },
          "encode": {
            "update": {
              "x": { "scale": "xOverview", "field": "Date" },
              "y": { "scale": "yOverview", "field": "Close" },
              "y2": { "scale": "yOverview", "value": 0 },
              "fill": { "value": "steelblue" }
            }
          }
        },
        {
          "type": "rect",
          "name": "brush",
          "encode": {
            "enter": {
              "y": { "value": 0 },
              "height": { "value": 70 },
              "fill": { "value": "#333" },
              "fillOpacity": { "value": 0.2 }
            },
            "update": {
              "x": { "signal": "brush[0]" },
              "x2": { "signal": "brush[1]" }
            }
          }
        },
        {
          "type": "rect",
          "interactive": false,
          "encode": {
            "enter": {
              "y": { "value": 0 },
              "height": { "value": 70 },
              "width": { "value": 1 },
              "fill": { "value": "firebrick" }
            },
            "update": {
              "x": { "signal": "brush[0]" }
            }
          }
        },
        {
          "type": "rect",
          "interactive": false,
          "encode": {
            "enter": {
              "y": { "value": 0 },
              "height": { "value": 70 },
              "width": { "value": 1 },
              "fill": { "value": "firebrick" }
            },
            "update": {
              "x": { "signal": "brush[1]" }
            }
          }
        }
      ]
    }
  ]
}

vega(document.getElementById("LibraPlayground"), spec);


