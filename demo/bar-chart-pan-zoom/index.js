registerAxesTransformer();
registerBarchartTransformer();
main();


async function main () {
  const alphabet = {
    A: 0.08167,
    B: 0.01492,
    C: 0.02782,
    D: 0.04253,
    E: 0.12702,
    F: 0.02288,
    G: 0.02015,
    H: 0.06094,
    I: 0.06966,
    J: 0.00153,
    K: 0.00772,
    L: 0.04025,
    M: 0.02406,
    N: 0.06749,
    O: 0.07507,
    P: 0.01929,
    Q: 0.00095,
    R: 0.05987,
    S: 0.06327,
    T: 0.09056,
    U: 0.02758,
    V: 0.00978,
    W: 0.0236,
    X: 0.0015,
    Y: 0.01974,
    Z: 0.00074,
  };

  const data = [];
  Object.keys(alphabet).forEach((key) => {
    data.push({
      name: key,
      value: alphabet[key],
    });
  });

  /*********************** 1. basic settings ******************/
  const width = 500,
    height = 380;

  /******************* 2. render static visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  const barChartMainLayer = renderBarChart(svg, width, height, data);
}

/**
 * @param {d3.Selection<SVGGElement, unknown, unknown, unknown>} root
 * @param {number} width
 * @param {number} height
 * @param {unknown[]} data
 * @returns
 */
function renderBarChart (root, width, height, data) {
  const margin = { top: 20, right: 0, bottom: 30, left: 40 };

  const scaleX = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const scaleY = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  /*********** The first difference compared with using pure d3 *********/
  // we create main layer, rather than: mainGroup = root.append("g")
  const backgroundLayer = Libra.Layer.initialize("D3Layer", {
    width,
    height,
    container: root.node(),
  });
  const axesTransformer = Libra.GraphicalTransformer.initialize("axesTransformer", {
    layer: backgroundLayer,
    sharedVar: {
      width,
      height,
      margin,
      scaleX,
      scaleY,
    },
  });

  const mainLayer = backgroundLayer.getLayerFromQueue("mainLayer");
  const barchartTransformer = Libra.GraphicalTransformer.initialize("barchartTransformer", {
    layer: mainLayer,
    sharedVar: {
      data,
      scaleX,
      scaleY,
    },
  });

  Libra.Instrument.initialize("PanXInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      // fixRange: true,
      transformers: [barchartTransformer, axesTransformer]
    },
  });
  Libra.Instrument.initialize("ZoomXInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      transformers: [barchartTransformer, axesTransformer]
    },
  });


  return mainLayer;
}

function registerAxesTransformer () {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      titleX: "",
      titleY: "",
    },
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
        .call(d3.axisBottom(scaleX).tickSizeOuter(0))
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

function registerBarchartTransformer () {
  Libra.GraphicalTransformer.register("barchartTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const data = transformer.getSharedVar("data");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");

      const root = d3.select(layer.getGraphic()).attr("class", "groupMarks");
      root
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("opacity", "1")
        .attr("fill", "steelblue")
        .attr("stroke", "#fff")
        .attr("x", (d) => scaleX(d.name))
        .attr("y", (d) => scaleY(d.value))
        .attr("height", (d) => {
          return scaleY(0) - scaleY(d.value);
        })
        .attr("width", scaleX.bandwidth());
    },
  });
}
