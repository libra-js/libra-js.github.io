require("./excentricLabelingInstrument");
const { Instrument, Layer } = Libra;

main();
//   

/**
 * @param {object} interactionParams
 * @param {string | number} interactionParams.lensRadius
 * @param {string | number} interactionParams.fontSize
 * @param {string | number} interactionParams.maxLabelsNum
 * @param {boolean} interactionParams.shouldVerticallyCoherent open the function: vertically coherent labeling.
 * @param {boolean} interactionParams.shouldHorizontallyCoherent open the function: horizontally coherent labeling.
 */
async function main() {
  const data = await d3.json("./data/cars.json");

  // fields of scatter plot
  const fieldX = "Horsepower";
  const fieldY = "Miles_per_Gallon";
  const fieldColor = "Origin";

  let width = 750;
  let height = 500;

  // layout
  const margin = { top: 50, right: 100, bottom: 10, left: 100 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  /************123123123123***** rendering part *********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewbox", `0 0 ${width} ${height}`);
  const root = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  renderScatterPlot(root, width, height, data, fieldX, fieldY, fieldColor);
}

function renderScatterPlot(
  root,
  width,
  height,
  data,
  fieldX,
  fieldY,
  fieldColor
) {
  // settings
  const radius = 3;
  const fieldLabel = "Name";

  // layout
  const margin = { top: 10, right: 100, bottom: 50, left: 50 };
  const legendMargin = {
    top: margin.top + 10,
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

  const mainLayer = axesLayer.getLayerFromQueue("main");
  registerCirclesTransformer();
  Libra.GraphicalTransformer.initialize("circlesTransformer", {
    layer: mainLayer,
    sharedVar: {
      data,
      scaleX,
      scaleY,
      scaleColor,
      fieldX,
      fieldY,
      fieldColor,
      radius,
    },
  });

  const labelAccessor = (circleElem) =>
    d3.select(circleElem).datum()[fieldLabel];
  const colorAccessor = (circleElem) =>
    scaleColor(d3.select(circleElem).datum()[fieldColor]);

  const instrument = Instrument.initialize("ExcentricLabelingInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: "all" } }],
    // sharedVar: {
    //   labelAccessor: (circleElem) => d3.select(circleElem).datum()[fieldLabel],
    //   colorAccessor: (circleElem) => scaleColor(d3.select(circleElem).datum()[fieldColor]),
    // }
  });
  instrument.setSharedVar("labelAccessor", labelAccessor);
  instrument.setSharedVar("colorAccessor", colorAccessor);
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
        .attr("opacity", 0.7)
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
        .attr("x", (width - margin.left - margin.right) / 2)
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
