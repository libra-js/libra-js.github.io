main();

async function main () {
  //const irisHierarchy = d3.hierarchy(irisHCluster).sum(d => d.size);

  /*********************** 1. basic settings ******************/
  const fieldX = "sepal_length";
  const fieldY = "petal_length";
  const fieldColor = "size";

  const width = 500,
    height = 380;

  const iris = await d3.csv("./data/bezdekIris.csv", (d) => ({
    [fieldX]: +d[fieldX],
    [fieldY]: +d[fieldY],
  }));
  const irisHCluster = await d3.json("./data/iris-hcluster.json");
  computeCentroidsOfCluster(iris, irisHCluster, fieldX, fieldY);
  

  /******************* 2. render static visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  renderScatterPlot(
    svg,
    width,
    height,
    iris,
    irisHCluster,
    fieldX,
    fieldY,
    fieldColor
  );

}

/**
 * @param {d3.Selection<SVGGElement, unknown, unknown, unknown>} root
 * @param {number} width
 * @param {number} height
 * @param {unknown[]} data
 * @param {string} fieldX
 * @param {string} fieldY
 * @param {string} fieldColor
 * @returns
 */
function renderScatterPlot (
  root,
  width,
  height,
  data,
  dataHierarchy,
  fieldX,
  fieldY,
  fieldColor
) {
  // settings
  const radius = 10;

  // layout
  const margin = { top: 10, right: 100, bottom: 40, left: 60 };

  // data manipulation
  const extentX = [0, d3.max(data, (d) => d[fieldX])];
  const extentY = [0, d3.max(data, (d) => d[fieldY])];
  // const valuesColorSet = new Set();
  // for (const datum of data) {
  //   valuesColorSet.add(datum[fieldColor]);
  // }
  // const valuesColor = Array.from(valuesColorSet);

  // scales
  const scaleX = d3
    .scaleLinear()
    .domain(extentX)
    .range([margin.left, width - margin.right])
    .nice()
  // .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain(extentY)
    .range([height - margin.bottom, margin.top])
    .nice()
  // .clamp(true);
  const scaleR = d3
    .scaleLinear()
    .domain([0, dataHierarchy.size])
    .range([0, Math.min(width, height) / 3]);
  // const scaleColor = d3
  //   .scaleOrdinal()
  //   .domain(valuesColor)
  //   .range(d3.schemeTableau10);

  const clipPath = root.append("clipPath").attr("id", "mainClip");
  clipPath
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);


  const backgroundLayer = Libra.Layer.initialize("D3Layer", {
    name: "backgroundLayer",
    width: width,
    height: height,
    container: root.node(),
  });
  registerAxesTransformer();
  const axesTransformer = Libra.GraphicalTransformer.initialize("axesTransformer", {
    layer: backgroundLayer,
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

  const mainLayer = backgroundLayer.getLayerFromQueue("main");
  registerClustersTransformer();
  const clustersTransformer = Libra.GraphicalTransformer.initialize("clustersTransformer", {
    layer: mainLayer,
    sharedVar: {
      scaleX, scaleY, scaleR, extentX, dataHierarchy,
      clipPathID: clipPath.attr("id")
    }
  });

  const zoomInstrument = Libra.Instrument.initialize("ZoomInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      fixRange: true,
      transformers: [clustersTransformer, axesTransformer],
    }
  });

  const panInstrument = Libra.Instrument.initialize("PanInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      fixRange: true,
      transformers: [clustersTransformer, axesTransformer],
    }
  });
}

function registerClustersTransformer () {
  Libra.GraphicalTransformer.register("clustersTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw: ({ layer, transformer }) => {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const scaleR = transformer.getSharedVar("scaleR");
      const extentX = transformer.getSharedVar("extentX");
      const dataHierarchy = transformer.getSharedVar("dataHierarchy");
      const clipID = transformer.getSharedVar("clipPathID");

      // service???
      const domainX = scaleX.domain();
      // const  zoomScale = (rangeX[1] - rangeX[0]) / width;
      const zoomScale = (domainX[1] - domainX[0]) / (extentX[1] - extentX[0]);
      const depth = Math.round(1 / zoomScale);
      const data = getNodesAtDepth(dataHierarchy, depth);

      const mainGroup = d3
        .select(layer.getGraphic())
        .attr("class", "groupMarks")
        .attr("clip-path", `url(#${clipID})`);

      mainGroup
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("class", "mark")
        .attr("fill", "rgb(220, 224, 254)")
        .attr("cx", (d) => scaleX(d.x))
        .attr("cy", (d) => scaleY(d.y))
        .attr("r", (d) => scaleR(d.size));

      mainGroup
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("class", "text")
        .attr("stroke", "rgb(57, 71, 181)")
        .attr("x", (d) => scaleX(d.x))
        .attr("y", (d) => scaleY(d.y))
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .text((d) => d.size);
    },
  });
}

function registerAxesTransformer () {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const margin = transformer.getSharedVar("margin");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const titleX = transformer.getSharedVar("titleX");
      const titleY = transformer.getSharedVar("titleY");

      const root = d3.select(layer.getGraphic());
      root.selectAll("*").remove();
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
          `translate(${-margin.left / 2 - 10}, ${(height - margin.top - margin.bottom) / 2
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

function computeCentroidsOfCluster (data, root, fieldX, fieldY) {
  
  if (root === null || root == undefined) return;
  
  if (root.isLeaf) {
    root.x = data[root.index][fieldX];
    root.y = data[root.index][fieldY];
  } else {
    const children0 = root.children[0];
    const children1 = root.children[1];
    computeCentroidsOfCluster(data, children0, fieldX, fieldY);
    computeCentroidsOfCluster(data, children1, fieldX, fieldY);
    root.x =
      (children0.x * children0.size + children1.x * children1.size) / root.size;
    root.y =
      (children0.y * children0.size + children1.y * children1.size) / root.size;
    // 
  }
}

function getNodesAtDepth (root, depth) {
  let nodes = [root];
  let curDepth = 0;
  while (curDepth < depth) {
    const curNodes = [...nodes];
    nodes = [];
    for (const node of curNodes) {
      if (!node.isLeaf) {
        nodes.push(...node.children);
      } else {
        nodes.push(node);
      }
    }
    curDepth++;
  }
  
  return nodes;
}
