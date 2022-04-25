//Libra.Instrument.register()

main();

/**
 * the entry point
 */
async function main() {
  const cars = await d3.json("./data/cars.json");

  /*********************** 1. basic settings ******************/
  // fields to bin
  const histFields = [
    "Cylinders",
    "Displacement",
    "Weight_in_lbs",
    "Acceleration",
  ]; // Can choosen from one of the properties.
  const fieldX = "Horsepower";
  const fieldY = "Miles_per_Gallon";
  const fieldColor = "Origin";

  const width = 950;
  const height = 500;
  const widthHist = width / 3,
    heightHist = height / histFields.length;
  const widthScatterPlot = width - widthHist,
    heightScatterPlot = height;

  // const layout = {
  //   width: 950,
  //   height: 500,
  //   layouts: [
  //     {
  //       width: widthHist,
  //       layouts: [
  //         {
  //           name: "hist0",
  //           repeat: {"y": histFields},
  //           margin: { top: 10, right: 10, bottom: 40, left: 50 },
  //           offset: {
  //             x: 0,
  //             y: {"repeat": "y"},
  //           },
  //         },
  //       ],
  //     },
  //     {
  //       name: "scatter",
  //       width: width - widthHist,
  //       height: height,
  //       offset: {
  //         x: widthHist,
  //         y: 0,
  //       },
  //     },
  //   ],
  // };

  /******************* 2. render static visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 ${width} ${height}`);
  const mainLayers = new Map(); // make it under the control of Libra?
  // histograms
  for (let i = 0; i < histFields.length; i++) {
    const key = histFields[i];
    const histLayer = Libra.Layer.initialize("D3Layer", {
      width: widthHist,
      height: heightHist,
      offset: {
        x: 0,
        y: i * heightHist,
      },
      container: svg.node(),
    });
    const histG = d3.select(histLayer.getGraphic());
    const histMainLayer = renderHistogram(
      histG,
      widthHist,
      heightHist,
      cars,
      key
    );
    mainLayers.set(key, histMainLayer);
  }
  // scatter plot
  const scatterLayer = Libra.Layer.initialize("D3Layer", {
    width: width - widthHist,
    height: height,
    offset: {
      x: widthHist,
      y: 0,
    },
    container: svg.node(),
  });
  const scatterG = d3.select(scatterLayer.getGraphic());
  const scatterMainLayer = renderScatterPlot(
    scatterG,
    {
      width: width - widthHist,
      height: height,
    },
    cars,
    fieldX,
    fieldY,
    fieldColor
  );
  const layers = [...mainLayers.values(), scatterMainLayer];
  

  /******************* 3. create instruments ***************************/
  // const brushInstruments = [];
  // let i = 0;
  // for (const key of histFields) {
  //   ++i;
  //   brushInstruments.push(
  //     Libra.Instrument.initialize("DataBrushXInstrument", {
  //       layers: [mainLayers.get(key)],
  //       sharedVar: {
  //         persistant: true,
  //         scaleX: scaleX,
  //         attrName: histFields[i]
  //       },
  //     })
  //   );
  // }
  // brushInstruments.push(
  //   Libra.Instrument.initialize("DataBrushInstrument", {
  //     layers: [scatterMainLayer],
  //     sharedVar: { persistant: true },
  //   })
  // );

  // /******************* 4. create crossSelectionService ***************************/
  // const crossSelectionService = Libra.InteractionService.initialize(
  //   "CrossSelectionService",
  //   {
  //     sharedVar: {
  //       $SelectionService: layers.map(
  //         (layer) => layer.services.find("SelectionService")[0]
  //       ),
  //     },
  //   }
  // );
  // layers.forEach((layer) => {
  //   // layer.setLayersOrder({ selectionLayer: -1 });
  //   layer.use(crossSelectionService);
  // });

  // /******************* 5. set Update Command for crossSelectionService ***************************/
  // const scatterServiceFeedback = async function (layer) {
  //   await Promise.all(layer.services.find("SelectionService").results);
  //   const fieldColor = layer.getSharedVar("fieldColor");
  //   const scaleColor = layer.getSharedVar("scaleColor");
  //   let circles = d3
  //     .select(layer.getLayerFromQueue("selectionLayer").getGraphic())
  //     .selectAll("circle");
  //   if (!circles.size()) {
  //     circles = d3.select(layer.getGraphic()).selectAll("circle");
  //   } else {
  //     d3.select(layer.getGraphic()).selectAll("circle").attr("stroke", "#ddd");
  //   }
  //   circles.attr("stroke", (d) => {
  //     if (!d.selected) return "#ddd";
  //     return scaleColor(d[fieldColor]);
  //   });
  // };

  // const histServiceFeedback = async function (layer) {
  //   await Promise.all(layer.services.find("SelectionService").results);
  //   const scaleY = layer.getSharedVar("scaleY");
  //   let mainRects = d3
  //     .select(layer.getLayerFromQueue("selectionLayer").getGraphic())
  //     .selectAll("rect.mark");
  //   if (!mainRects.size()) {
  //     mainRects = d3.select(layer.getGraphic()).selectAll("rect.mark");
  //   } else {
  //     d3.select(layer.getGraphic()).selectAll("rect.mark").attr("fill", "gray");
  //   }
  //   mainRects
  //     .attr("fill", "steelblue")
  //     .attr("y", (d) => {
  //       if (d == undefined) debugger;
  //       d = d.filter((d) => d.selected);
  //       return scaleY(d.length);
  //     })
  //     .attr("height", (d) => {
  //       d = d.filter((d) => d.selected);
  //       return scaleY(0) - scaleY(d.length);
  //     });
  // };

  // brushInstruments.forEach((instrument) => {
  //   instrument.on(
  //     ["drag", "dragend", "dragabort"],
  //     Libra.Command.initialize("refreshChart", {
  //       execute: () => {
  //         const extent = crossSelectionService.getSharedVar("extent", {
  //             keepAll: true,
  //           }),
  //           attrName = crossSelectionService.getSharedVar("attrNameX", {
  //             keepAll: true,
  //           }),
  //           extentX = crossSelectionService.getSharedVar("extentX", {
  //             layer: scatterMainLayer,
  //           }),
  //           extentY = crossSelectionService.getSharedVar("extentY", {
  //             layer: scatterMainLayer,
  //           }),
  //           attrNameX = crossSelectionService.getSharedVar("attrNameX", {
  //             layer: scatterMainLayer,
  //           }),
  //           attrNameY = crossSelectionService.getSharedVar("attrNameY", {
  //             layer: scatterMainLayer,
  //           });
  //         const extents = new Map();
  //         extent.forEach((e, i) => {
  //           if (e && e[0] != e[1]) {
  //             extents.set(attrName[i], e);
  //           }
  //         });
  //         if (extentX && extentX[0] !== extentX[1]) {
  //           extents.set(attrNameX, extentX);
  //         }
  //         if (extentY && extentY[0] !== extentY[1]) {
  //           extents.set(attrNameY, extentY);
  //         }
  //         cars.forEach((d) => {
  //           let selected = true;
  //           for (const key of extents.keys()) {
  //             const extent = extents.get(key);
  //             if (extent && (d[key] < extent[0] || d[key] > extent[1])) {
  //               selected = false;
  //               break;
  //             }
  //           }
  //           d.selected = selected;
  //         });
  //       },
  //       feedback: [
  //         function () {
  //           layers.forEach((layer) => {
  //             if (layer.getSharedVar("fieldY")) {
  //               scatterServiceFeedback(layer);
  //             } else {
  //               histServiceFeedback(layer);
  //             }
  //           });
  //         },
  //       ],
  //     })
  //   );
  // });
}

/**
 *
 * @param {d3.Selection<SVGGElement, unknown, unknown, unknown>} root
 * @param {number} width
 * @param {number} height
 * @param {unknown} data
 * @param {string} key bin data with the "key" property
 * @returns
 */
function renderHistogram(root, width, height, data, key) {
  // layout
  const margin = { top: 10, right: 10, bottom: 40, left: 50 };
  const padding = 1;
  // width -= margin.left + margin.right;
  // height -= margin.top + margin.bottom;

  // data manipulation
  const extent = d3.extent(data, (d) => d[key]);
  const bin = d3
    .bin()
    .domain(extent)
    .value((d) => d[key]);
  const binnedData = bin(data);
  let maxY = 0;
  binnedData.forEach((d) => {
    if (d.length > maxY) maxY = d.length;
  });
  const bandStep = width / binnedData.length;
  const bandWidth = bandStep * 0.9;
  const bandPadding = (bandStep - bandWidth) / 2;

  // scales
  const scaleX = d3
    .scaleLinear()
    .domain(extent)
    .range([margin.left, width - margin.right])
    .nice()
    .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain([0, maxY])
    .range([height - margin.bottom, margin.top])
    .nice()
    .clamp(true);

  //#region 1 background view
  const backgroundLayer = Libra.Layer.initialize("D3Layer", {
    name: "histBG",
    width: width,
    height: height,
    container: root.node(), //rootView.getGraphic(),
  });
  // registerHistogramTransformer();
  // Libra.GraphicalTransformer.initialize("histogramTransformer", {
  //   layer: backgroundLayer,
  //   sharedVar: {
  //     scaleX: scaleX,
  //     scaleY: scaleY,
  //     binnedData: binnedData,
  //     padding: padding,
  //     fill: "grey",
  //   },
  // });
  registerAxesTransformer();
  Libra.GraphicalTransformer.initialize("axesTransformer", {
    layer: backgroundLayer,
    sharedVar: {
      width: width,
      height: height,
      margin: margin,
      scaleX: scaleX,
      scaleY: scaleY,
      titleX: key,
      // titleY: key,
    },
  });
  //#endregion

  //#region 2 histogram view
  const mainLayer = backgroundLayer.getLayerFromQueue("histMain");
  registerHistogramTransformer();
  Libra.GraphicalTransformer.initialize("histogramTransformer", {
    layer: mainLayer,
    sharedVar: {
      result: binnedData,
      scaleX: scaleX,
      scaleY: scaleY,
      padding: padding,
      // fill: "steelblue",
      fill: "grey",
      y: margin.top,
      height: height - margin.top,
    },
  });
  //#endregion

  registerFilterAndRecomputeService();
  const filterAndBinService = Libra.InteractionService.initialize(
    "filterAndRecomputeService"
  );
  filterAndBinService.setSharedVar("data", data);
  filterAndBinService.setSharedVar("key", key);
  filterAndBinService.setSharedVar("extent", extent);
  filterAndBinService.setSharedVar("computor", bin);
  filterAndBinService.transformers.add("histogramTransformer", {
    transient: true,
    layer: mainLayer.getLayerFromQueue("frontLayer"),
    sharedVar: {
      scaleX: scaleX,
      scaleY: scaleY,
      result: [],
      padding: padding,
      fill: "steelblue",
      y: margin.top,
      height: height - margin.top,
    },
  });
  const dataBrushXInstrument = Libra.Instrument.initialize(
    "DataBrushXInstrument",
    {
      layers: [{ layer: mainLayer, options: { pointerEvents: "all" } }],
      sharedVar: {
        scaleX: scaleX,
        extentX: scaleX.domain(),
        attrName: key,
        y: margin.top,
        height: height - margin.top - margin.bottom,
      },
    }
  );
  dataBrushXInstrument.on(
    "drag",
    ({ evnet, instrument, interactor, layer }) => {
      const a = instrument.services.find("SelectionService");
      const extent = a.getSharedVar("extent")[0];
      filterAndBinService.setSharedVar("extent", extent);
    }
  );

  dataBrushXInstrument.services.find("SelectionService")[0]._transformers = [];

  return mainLayer;
}

function registerFilterAndRecomputeService() {
  Libra.InteractionService.register("filterAndRecomputeService", {
    constructor: Libra.InteractionService.AnalysisService,
    params: { data: [], key: "", extent: [], computor: (d) => d },
    algorithm({ data, key, extent, computor }) {
      const filteredData = data.filter(
        (d) => extent[0] <= d[key] && d[key] <= extent[1]
      );
      const binnedData = computor(filteredData);
      return binnedData;
    },
  });
}

function registerAxesTransformer() {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const margin = transformer.getSharedVar("margin");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const titleX = transformer.getSharedVar("titleX");

      const root = d3.select(layer.getGraphic());
      // groups
      const groupAxisX = root
        .append("g")
        .attr("class", "groupAxisX")
        .attr("transform", `translate(${0}, ${height - margin.bottom})`);
      const groupAxisY = root
        .append("g")
        .attr("class", "groupAxisY")
        .attr("transform", `translate(${margin.left}, ${0})`);
      const groupTitle = root
        .append("g")
        .attr("class", "title")
        .attr(
          "transform",
          `translate(${width / 2}, ${height - margin.bottom})`
        );
      // draw things except main layer
      groupAxisX.call(d3.axisBottom(scaleX));
      groupAxisY
        .call(d3.axisLeft(scaleY))
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("stroke-opacity", 0.1)
            .attr("x2", width - margin.left - margin.right)
        )
        .call((g) =>
          g.selectAll(".tick").each(function (node, i) {
            if (i % 2 === 1) d3.select(this).select("text").remove();
          })
        );
      groupTitle
        .append("text")
        .text(titleX)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr(
          "y",
          groupAxisX.node().getBBox().height +
            groupTitle.node().getBBox().height
        );
    },
  });
}

function registerHistogramTransformer() {
  Libra.GraphicalTransformer.register("histogramTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const binnedData = transformer.getSharedVar("result");
      const padding = transformer.getSharedVar("padding");
      const fill = transformer.getSharedVar("fill") ?? "grey";

      const root = d3.select(layer.getGraphic());
      root
        .selectAll("new-rect")
        .data(binnedData)
        .join("rect")
        .attr("fill", fill)
        .attr("x", (d, i) => scaleX(d.x0) + padding)
        .attr("y", (d) => scaleY(d.length))
        .attr("width", (d, i) => scaleX(d.x1) - scaleX(d.x0) - 2 * padding)
        .attr("height", (d) => scaleY(0) - scaleY(d.length));
    },
  });
}

function renderScatterPlot(
  root,
  { width, height, offset },
  data,
  fieldX,
  fieldY,
  fieldColor
) {
  // settings
  const radius = 3;
  const fieldLabel = "Name";

  // layout
  const margin = { top: 10, right: 100, bottom: 40, left: 50 };
  const legendMargin = {
    top: margin.top + 40,
    right: margin.right / 2,
    bottom: (height / 6) * 5,
    left: width - margin.right,
  };
  // data manipulation
  data = data.filter((d) => !!(d[fieldX] && d[fieldY]));
  const extentX = [0, d3.max(data, (d) => d[fieldX])];
  const extentY = [0, d3.max(data, (d) => d[fieldY])];
  const valuesColorSet = new Set();
  for (const datum of data) {
    valuesColorSet.add(datum[fieldColor]);
  }
  const valuesColor = Array.from(valuesColorSet);

  // scales
  const scaleX = d3
    .scaleLinear()
    .domain(extentX)
    .range([margin.left, width - margin.right])
    .nice()
    .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain(extentY)
    .range([height - margin.bottom, margin.top])
    .nice()
    .clamp(true);
  const scaleColor = d3
    .scaleOrdinal()
    .domain(valuesColor)
    .range(d3.schemeTableau10);

  const axesLayer = Libra.Layer.initialize("D3Layer", {
    name: "axesLayer",
    width: width,
    height: height,
    offset: offset,
    container: root.node(),
  });
  registerAxesTransformer();
  Libra.GraphicalTransformer.initialize("axesTransformer", {
    layer: axesLayer,
    sharedVar: {
      width,
      height,
      margin,
      scaleX,
      scaleY,
      titleX: fieldX,
      titleY: fieldY,
    },
  });

  const legendLayer = axesLayer.getLayerFromQueue("legend");
  registerLegendTransformer();
  Libra.GraphicalTransformer.initialize("legendTransformer", {
    layer: legendLayer,
    sharedVar: {
      width,
      height,
      margin: legendMargin,
      scaleColor,
      title: fieldColor,
    },
  });

  const labelAccessor = (circleElem) =>
    d3.select(circleElem).datum()[fieldLabel];
  const colorAccessor = (datum) => {
    return scaleColor(datum);
  };

  const mainLayer = axesLayer.getLayerFromQueue("main");
  registerCirclesTransformer();
  Libra.GraphicalTransformer.initialize("circlesTransformer", {
    layer: mainLayer,
    sharedVar: {
      data,
      scaleX,
      scaleY,
      // scaleColor: colorAccessor,
      scaleColor: () => "grey",
      fieldX,
      fieldY,
      fieldColor,
      radius,
    },
  });

  const dataBrushInstrument = Libra.Instrument.initialize(
    "DataBrushInstrument",
    {
      layers: [{ layer: mainLayer, options: { pointerEvents: "all" } }],
      sharedVar: {
        scaleX: scaleX,
        scaleY: scaleY,
        // scaleY: scaleY,
        attrNameX: fieldX,
        attrNameY: fieldY,
        extentX: scaleX.domain(),
        extentY: scaleY.domain(),
        highlightAttrValues: {
          stroke: colorAccessor,
        },
      },
    }
  );
  return mainLayer;
}

function registerCirclesTransformer() {
  Libra.GraphicalTransformer.register("circlesTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const scaleColor = transformer.getSharedVar("scaleColor");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const fieldColor = transformer.getSharedVar("fieldColor");
      const fieldX = transformer.getSharedVar("fieldX");
      const fieldY = transformer.getSharedVar("fieldY");
      const radius = transformer.getSharedVar("radius") ?? 5;

      const data = transformer.getSharedVar("data");
      const root = d3.select(layer.getGraphic());

      const circles = root
        .selectAll("circle")
        .data(data)
        .join("circle")
        // .attr("opacity", 0.7)
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr("stroke", (d) => scaleColor(d[fieldColor]))
        .attr("cx", (d) => scaleX(d[fieldX]))
        .attr("cy", (d) => scaleY(d[fieldY]))
        .attr("r", radius);
    },
  });
}

function registerAxesTransformer() {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const margin = transformer.getSharedVar("margin");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const titleX = transformer.getSharedVar("titleX");
      const titleY = transformer.getSharedVar("titleY");

      const root = d3.select(layer.getGraphic());
      // groups
      const groupAxisX = root
        .append("g")
        .attr("class", "groupAxisX")
        .attr("transform", `translate(0, ${height - margin.bottom})`);
      const groupAxisY = root
        .append("g")
        .attr("class", "groupAxisY")
        .attr("transform", `translate(${margin.left}, 0)`);

      // draw
      groupAxisX
        .call(d3.axisBottom(scaleX))
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("stroke-opacity", 0.1)
            .attr("y2", -(height - margin.top - margin.bottom))
        )
        .append("text")
        .text(titleX)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", 32);
      groupAxisY
        .call(d3.axisLeft(scaleY))
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("stroke-opacity", 0.1)
            .attr("x2", width - margin.left - margin.right)
        )
        .append("g")
        .attr(
          "transform",
          `translate(${-margin.left / 2 - 10}, ${
            (height - margin.top - margin.bottom) / 2
          })`
        )
        .append("text")
        .text(titleY)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .style("writing-mode", "tb")
        .attr("transform", "rotate(180)");
    },
  });
}

function registerLegendTransformer() {
  Libra.GraphicalTransformer.register("legendTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const scaleColor = transformer.getSharedVar("scaleColor");
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const margin = transformer.getSharedVar("margin");
      const fieldColor = transformer.getSharedVar("fieldColor");
      const title = transformer.getSharedVar("title");
      const radius = transformer.getSharedVar("radius");

      const root = d3.select(layer.getGraphic());

      // settings

      // data manipulation
      const domain = scaleColor.domain();

      //scale
      const scaleY = d3
        .scalePoint()
        .domain(domain)
        .range([height - margin.bottom, margin.top]);

      // groups
      const groupTitle = root
        .append("g")
        .attr("class", "groupTitle")
        .attr("transform", `translate(${width - margin.right}, 0)`);
      const groupMainView = root
        .append("g")
        .attr("class", "mainView")
        .attr("transform", `translate(${width - margin.right}, 0)`);
      const groupAxisY = groupMainView.append("g").attr("class", "groupAxisY");
      const groupMain = groupMainView.append("g").attr("class", "groupMarks");

      groupAxisY.call(d3.axisRight(scaleY)).call((g) => {
        g.select(".domain").remove();
        // g.selectAll("line").remove();
      });
      groupMain
        .selectAll("circle")
        .data(domain)
        .join("circle")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", (d) => scaleColor(d))
        .attr("cx", -(radius * 2))
        .attr("cy", (d) => scaleY(d))
        .attr("r", radius);

      const bbox = groupMainView.node().getBBox();
      groupTitle
        .append("text")
        .text(title)
        .attr("x", bbox.x + bbox.width / 2)
        .attr("y", margin.top - 20)
        .attr("fill", "black")
        .attr("stroke", "black")
        .style("font-size", 12)
        .style("dominant-baseline", "auto")
        .style("text-anchor", "middle");
    },
    sharedVar: {
      width: 0,
      height: 0,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      title: "",
      radius: 5,
    },
  });
}

function attachInstrumentToLayerAndSetCommandsForHist(
  mainLayer,
  histBrushInstrument,
  layersToListen,
  extents,
  crossSelectionService
) {
  histBrushInstrument.attach(mainLayer);
  extents = crossSelectionService.getSharedVar("extents");

  mainLayer.services.find("SelectionService").on(
    "update",
    Libra.Command.initialize("HistUpdate", {
      execute: ({ layer }) => {
        const key = layer.getSharedVar("key");
        const extent = layer.services.getSharedVar("extent")[0];
        if (extent[0] == extent[1]) {
          extents.delete(key);
        } else {
          extents.set(key, extent);
        }
      },
    })
  );
}

function attachInstrumentToLayerAndSetCommandsForScatter(
  scatterMainLayer,
  scatterBrushInstrument,
  layersToListen,
  extents,
  crossSelectionService
) {
  scatterBrushInstrument.attach(scatterMainLayer);
  extents = crossSelectionService.getSharedVar("extents");

  scatterMainLayer.services.find("SelectionService").on(
    "update",
    Libra.Command.initialize("RedrawScatter", {
      execute: ({ layer }) => {
        const fieldX = layer.getSharedVar("fieldX");
        const fieldY = layer.getSharedVar("fieldY");
        const extentX = layer.services.getSharedVar("extentX")[0];
        const extentY = layer.services.getSharedVar("extentY")[0];
        if (extentX[0] == extentX[1] || extentY[0] == extentY[1]) {
          extents.delete(fieldX);
          extents.delete(fieldY);
        } else {
          extents.set(fieldX, extentX);
          extents.set(fieldY, extentY);
        }
      },
    })
  );
}
