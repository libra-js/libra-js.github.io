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
  registerEdgeLensLayoutService();
  registerLinkTransformer();
  const edgeService = Libra.InteractionService.initialize("EdgeLensService");
  edgeService.setSharedVar("edges", links);
  edgeService.transformers.add("linkTransformer", {
    transient: true,
    layer: linkLayer,
    sharedVar: { layoutResult: [] },
  });

  //#endregion

  //#region 1.2 node layer
  const nodeLayer = linkLayer.getLayerFromQueue("node");
  registerNodeTransformer();
  Libra.GraphicalTransformer.initialize("nodeTransformer", {
    layer: nodeLayer,
    sharedVar: {
      layoutResult: nodes,
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

function registerEdgeLensLayoutService () {
  Libra.InteractionService.register("EdgeLensService", {
    constructor: Libra.InteractionService.LayoutService,
    params: { edges: [], vertices: [], controlPoints: [] },
    layout ({ edges, vertices, controlPoints }) {
      const line = d3
        .line(
          (d) => d.x,
          (d) => d.y
        )
        .curve(d3.curveBasis);
      if (controlPoints.length <= 0) {
        return edges
          .map((edge) => [edge.source, edge.target])
          .map((x) => line(x));
      }
      const controlPoint = controlPoints[0];
      // const controlPoint = { x: 198.70201841897062, y: 238.64650526979722 };
      return edges
        .map((edge) => {
          const tangentVec = [
            edge.target.x - edge.source.x,
            edge.target.y - edge.source.y,
          ];
          const pointVec = [
            controlPoint.x - edge.source.x,
            controlPoint.y - edge.source.y,
          ];
          const normTangentVec = tangentVec.map(
            (x) =>
              x /
              Math.sqrt(
                tangentVec[0] * tangentVec[0] + tangentVec[1] * tangentVec[1]
              )
          );
          const project =
            (normTangentVec[0] * pointVec[0] +
              normTangentVec[1] * pointVec[1]) /
            Math.sqrt(
              tangentVec[0] * tangentVec[0] + tangentVec[1] * tangentVec[1]
            );
          const cos =
            (tangentVec[0] * pointVec[0] + tangentVec[1] * pointVec[1]) /
            Math.sqrt(
              tangentVec[0] * tangentVec[0] + tangentVec[1] * tangentVec[1]
            ) /
            Math.sqrt(pointVec[0] * pointVec[0] + pointVec[1] * pointVec[1]);
          if (project > 0 && project < 1 && cos < 1) {
            const normNormalVec = [-normTangentVec[1], normTangentVec[0]];
            const normCos =
              (normNormalVec[0] * pointVec[0] +
                normNormalVec[1] * pointVec[1]) /
              Math.sqrt(
                normNormalVec[0] * normNormalVec[0] +
                normNormalVec[1] * normNormalVec[1]
              ) /
              Math.sqrt(pointVec[0] * pointVec[0] + pointVec[1] * pointVec[1]);
            if (normCos > 0) {
              normNormalVec[0] = -normNormalVec[0];
              normNormalVec[1] = -normNormalVec[1];
            }
            const dist = -(
              normNormalVec[0] * pointVec[0] +
              normNormalVec[1] * pointVec[1]
            );
            const mirrorSeed = 20;
            if (dist >= mirrorSeed) {
              return [edge.source, edge.target];
            } else {
              const mirrorPoint = [
                controlPoint.x + normNormalVec[0] * mirrorSeed,
                controlPoint.y + normNormalVec[1] * mirrorSeed,
              ];
              const moveDist = mirrorSeed - dist;
              const mirrorSource = [
                edge.source.x + normNormalVec[0] * moveDist,
                edge.source.y + normNormalVec[1] * moveDist,
              ];
              const mirrorTarget = [
                edge.target.x + normNormalVec[0] * moveDist,
                edge.target.y + normNormalVec[1] * moveDist,
              ];
              return [
                edge.source,
                {
                  x: (mirrorSource[0] + mirrorPoint[0]) / 2,
                  y: (mirrorSource[1] + mirrorPoint[1]) / 2,
                },
                {
                  x: (mirrorTarget[0] + mirrorPoint[0]) / 2,
                  y: (mirrorTarget[1] + mirrorPoint[1]) / 2,
                },
                edge.target,
              ];
            }
          } else {
            return [edge.source, edge.target];
          }
        })
        .map((x) => line(x));
    },
  });
}
