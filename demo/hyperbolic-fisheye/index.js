main();

async function main () {
  const data = await d3.json("./data/miserables.json");
  data.nodes.forEach(
    (node) =>
    (node.degree = data.links.filter(
      (link) => link.target === node.id || link.source === node.id
    ).length)
  );

  const width = 500,
    height = 450;

  /******************* 2. render visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  renderNodeLinkDiagram(svg, width, height, data.nodes, data.links);

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
function renderNodeLinkDiagram (root, width, height, nodes, links) {
  links = links.map((d, i) => ({ ...d, index: i }));
  const ticks = 200;
  const margin = { top: 30, right: 0, bottom: 100, left: 0 };

  
  
  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(0.3)
    )
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force(
      "center",
      d3.forceCenter(
        (width - margin.left - margin.right) / 2 + margin.left,
        (height - margin.top - margin.bottom) / 2 + margin.top
      )
    )
    .stop()
    .tick(ticks);

  const fieldColor = "degree";
  const fieldRadius = "degree";

  const extentColor = [0, d3.max(nodes, (d) => d[fieldColor])];
  const scaleColor = d3
    .scaleDiverging()
    .domain([
      extentColor[1],
      (extentColor[1] - extentColor[0]) / 2 + extentColor[0],
      extentColor[0],
    ])
    .interpolator(d3.interpolateRdYlGn);

  const extentRadius = d3.extent(nodes, (d) => d[fieldRadius]);
  const scaleRadius = d3.scaleLinear().domain(extentRadius).range([3, 10]);

  const groupNodeLink = root.append("g").attr("class", "nodeLinkView");
  const groupSlider = root
    .append("g")
    .attr("class", "sliderView")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  //#region 1. node-link view

  //#region 1.1 link layer
  const linkLayer = Libra.Layer.initialize("D3Layer", {
    name: "link",
    width: width,
    height: height - margin.bottom,
    container: groupNodeLink.node(),
  });
  registerFisheyeEdgeLayoutService();
  registerLinkTransformer();
  const edgeService =
    Libra.InteractionService.initialize("FisheyeEdgeService");
  edgeService.setSharedVar("edges", links);
  edgeService.setSharedVar("vertices", nodes);
  edgeService.transformers.add("linkTransformer", {
    transient: true,
    layer: linkLayer,
    sharedVar: { layoutResult: links },
  });

  //#endregion

  //#region 1.2 node layer
  const nodeLayer = linkLayer.getLayerFromQueue("node");
  registerFisheyeNodeLayoutService();
  registerNodeTransformer();
  const nodeService =
    Libra.InteractionService.initialize("FisheyeNodeService");
  nodeService.setSharedVar("vertices", nodes);
  nodeService.transformers.add("nodeTransformer", {
    transient: true,
    layer: nodeLayer,
    sharedVar: {
      layoutResult: [],
      fieldColor,
      fieldRadius,
      scaleColor,
      scaleRadius,
    },
  });
  //#endregion

  //#endregion

  /** 2.3 instrument */
  // const highlightAttr = "stroke-width";
  // const highlightValue = "5";
  Libra.Instrument.initialize("HoverInstrument", {
    layers: [{ layer: linkLayer, options: { pointerEvents: 'all' } }],
    on: {
      hover: [
        ({ event }) => {
          nodeService.setSharedVar("controlPoints", [
            { x: event.offsetX, y: event.offsetY },
          ]);
          edgeService.setSharedVar("controlPoints", [
            { x: event.offsetX, y: event.offsetY },
          ]);
        },
      ],
    },
  });
}

function registerNodeTransformer () {
  Libra.GraphicalTransformer.register("nodeTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const scaleColor = transformer.getSharedVar("scaleColor");
      const scaleRadius = transformer.getSharedVar("scaleRadius");

      const fieldColor = transformer.getSharedVar("fieldColor");
      const fieldRadius = transformer.getSharedVar("fieldRadius");

      const nodes = transformer.getSharedVar("layoutResult");
      const root = d3.select(layer.getGraphic()).attr("class", "nodeLayer");

      root
        .append("g")
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        // .attr("fill", (d) => (d.children ? null : scaleColor(d[fieldColor])))
        .attr("fill", (d) => (d.children ? null : "steelblue"))
        .attr("r", (d) => {
          const a = d.children ? null : scaleRadius(d[fieldRadius]);
          return a;
        })
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    },
  });
}

function registerLinkTransformer () {
  Libra.GraphicalTransformer.register("linkTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const links = transformer.getSharedVar("layoutResult");
      const root = d3.select(layer.getGraphic()).attr("class", "linkLayer");
      root
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", (d) => d);
    },
  });
}

const FISHEYE_LENS = 100;

function registerFisheyeEdgeLayoutService () {
  Libra.InteractionService.register("FisheyeEdgeService", {
    constructor: Libra.InteractionService.LayoutService,
    params: { edges: [], vertices: [], controlPoints: [] },
    layout ({ edges, vertices, controlPoints }) {
      const line = d3
        .line(
          (d) => d.x,
          (d) => d.y
        )
        .curve(d3.curveBasis);
      if (controlPoints.length <= 0 || vertices.length <= 0) {
        return edges
          .map((edge) => [edge.source, edge.target])
          .map((x) => line(x));
      }
      const fisheye = d3.circular().radius(FISHEYE_LENS).distortion(2);
      const controlPoint = controlPoints[0];
      fisheye.focus([controlPoint.x, controlPoint.y]);

      return edges
        .map((edge) => {
          const source = fisheye([edge.source.x, edge.source.y])
          const target = fisheye([edge.target.x, edge.target.y])
          return [{ x: source[0], y: source[1] }, { x: target[0], y: target[1] }]
        })
        .map((x) => line(x));
    },
  });
}

function registerFisheyeNodeLayoutService () {
  Libra.InteractionService.register("FisheyeNodeService", {
    constructor: Libra.InteractionService.LayoutService,
    params: { edges: [], vertices: [], controlPoints: [] },
    layout ({ edges, vertices, controlPoints }) {
      if (controlPoints.length <= 0 || vertices.length <= 0) {
        return vertices;
      }
      const fisheye = d3.circular().radius(FISHEYE_LENS).distortion(2);
      const controlPoint = controlPoints[0];
      fisheye.focus([controlPoint.x, controlPoint.y]);

      return vertices.map((x) => {
        const f = fisheye([x.x, x.y])
        return { ...x, x: f[0], y: f[1] }
      });
    },
  });
}
