require("./excentricLabelingInstrument");
main();

async function main() {
  /** data **/
  const data = await d3.json("./data/flare-2.json");

  /*********************** 1. basic settings ******************/
  const width = 700,
    height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 100 };
  const innerWidth = width - margin.right - margin.left,
    innerHeight = height - margin.top - margin.bottom;
  const labelField = "name";

  /******************* 2. rendering ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);
  const translateGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  const mainLayer = renderTreemap(
    translateGroup,
    innerWidth,
    innerHeight,
    data,
    labelField
  );
}

function renderTreemap(root, width, height, data, labelField) {
  // data
  const hierarchicalData = d3
    .hierarchy(data)
    .sum((node) => node.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);
  hierarchicalData.children.map((node, index) => (node.groupId = index));

  // layout
  const treemap = d3.treemap().size([width, height]).padding(1);
  const treemapData = treemap(hierarchicalData);
  

  // scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(hierarchicalData.children.map((node) => node.groupId))
    .range(d3.schemeTableau10);

  // marks
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: width,
    height: innerHeight,
    container: root.node(),
  });
  registerRectsTransformer();
  
  Libra.GraphicalTransformer.initialize("rectsTransformer", {
    layer: mainLayer,
    sharedVar: {
      data: treemapData,
      scaleColor: colorScale,
    },
  });

  // mainLayer.setSharedVar(
  // "labelAccessor",
  // (elem) => d3.select(elem).datum().data[labelField]
  // );
  const labelAccessor = (elem) => d3.select(elem).datum().data[labelField];
  const colorAccessor = (elem) => colorScale(d3.select(elem).datum().groupId);

  const instrument = Libra.Instrument.initialize(
    "ExcentricLabelingInstrument",
    {
      layers: [{ layer: mainLayer, options: { pointerEvents: "all" } }],
      sharedVar: {
        lensRadius: 30,
        fontSize: 15,
        maxLabelsNum: 10,
        // verticallyCoherent: true,
        // horizontallyCoherent: false,
        spaceBetweenLabels: 3,
        countLabelDistance: 20,
        stroke: "black",
        strokeWidth: 2,
        labelAccessor: labelAccessor,
        colorAccessor: colorAccessor,
      },
    }
  );
  
}

function registerRectsTransformer() {
  
  Libra.GraphicalTransformer.register("rectsTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      data: null,
      opacity: 0.7,
      scaleColor: () => "black",
    },
    redraw({ layer, transformer }) {
      const scaleColor = transformer.getSharedVar("scaleColor");
      const opacity = transformer.getSharedVar("opacity");
      const data = transformer.getSharedVar("data");
      const root = d3.select(layer.getGraphic());

      const groups = root.selectAll("g").data(data.children).join("g");
      const rects = groups
        .selectAll("rect")
        .data((d, i) => {
          const leaves = d.leaves();
          leaves.forEach((leave) => (leave.groupId = d.groupId));
          return leaves;
        })
        .join("rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d) => scaleColor(d.groupId))
        .attr("opacity", opacity);
    },
  });
}
