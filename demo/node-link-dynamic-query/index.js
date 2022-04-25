// require("./brushInstrument");

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
    height = 520;

  const nodeLinkProportion = 0.8;
  const nodeLinkMainProportion = 0.9;
  const nodeLinkColorbarProportion = 1 - nodeLinkMainProportion;
  const histogramProportion = 1 - nodeLinkProportion;
  const viewLayouts = {
    nodelink: {
      offset: { x: 0, y: 0 },
      width: width,
      height: height * nodeLinkProportion,
      margin: { top: 0, right: 30, bottom: 12, left: 50 },
    },
    histogram: {
      offset: { x: 0, y: height * nodeLinkProportion },
      width: width,
      height: height * histogramProportion,
      margin: { top: 10, right: 30, bottom: 50, left: 50 },
    },
  };

  /******************* 2. render visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  // const nodeLinkView = Libra.Layer.initialize("D3View", {
  //   name: "nodelinkView",
  //   offset: {x: 0, y: 0},
  //   container: svg.node(),
  // });
  const nodeLinkView = Libra.Layer.initialize("D3Layer", {
    name: "nodelinkView",
    width: viewLayouts.nodelink.width,
    height: viewLayouts.nodelink.height,
    container: svg.node(),
  });
  setOffsetsForLayer(nodeLinkView, viewLayouts.nodelink.offset);
  setClassNameForLayer(nodeLinkView, "nodelinkView");

  const histogramView = Libra.Layer.initialize("D3Layer", {
    name: "histogramView",
    width: viewLayouts.histogram.width,
    height: viewLayouts.histogram.height,
    container: svg.node(),
  });
  setOffsetsForLayer(histogramView, viewLayouts.histogram.offset);
  setClassNameForLayer(histogramView, "histogramView");

  const [nodeLayer, service, transformer, refreshNodeLink] = renderNodeLinkView(
    nodeLinkView,
    viewLayouts.nodelink,
    data.nodes,
    data.links
  );
  renderHistogramView(
    histogramView,
    viewLayouts.histogram,
    data.nodes,
    "degree",
    nodeLayer,
    service,
    transformer,
    refreshNodeLink
  );
  // renderColorBarView(svg, width, height, data.nodes, data.links);

  //...instrumentSharedVars,
  /******************* 3. append instruments ********************/
}

function renderNodeLinkView (rootView, mainLayout, nodes, links) {
  const root = d3.select(rootView.getGraphic());
  // const { main: mainLayout, colorbar: colorbarLayout } = layouts.layouts;
  const colorbarLayout = {
    // offset: {x: mainLayout.width - mainLayout.margin.right, y: 0},
    offset: { x: 0, y: 0 },
    width: mainLayout.width,
    height: mainLayout.height,
    margin: {
      top: 0,
      right: 5,
      bottom: 30,
      left: 5 + mainLayout.width - mainLayout.margin.right,
    },
  };
  links = links.map((d, i) => ({ ...d, index: i }));
  const ticks = 200;
  console.log("nodes", nodes);
  console.log("links", links);
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
        (mainLayout.width - mainLayout.margin.left - mainLayout.margin.right) /
        2 +
        mainLayout.margin.left,
        (mainLayout.height - mainLayout.margin.top - mainLayout.margin.bottom) /
        2 +
        mainLayout.margin.top
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

  //#region colorbar layer
  const colorbarLayer = Libra.Layer.initialize("D3Layer", {
    name: "nodelinkColorbarView",
    width: colorbarLayout.width,
    height: colorbarLayout.height,
    container: rootView.getGraphic(),
  });
  setOffsetsForLayer(colorbarLayer, colorbarLayout.offset);
  setClassNameForLayer(colorbarLayer, "colorbarLayer");
  registerGradientRectTransformer();
  Libra.GraphicalTransformer.initialize("gradientRectTransformer", {
    layer: colorbarLayer,
    sharedVar: {
      width: colorbarLayout.width,
      height: colorbarLayout.height,
      margin: colorbarLayout.margin,
      vertical: true,
      reverse: true,
      scaleColor,
    },
  });
  //#endregion

  //#region link layer
  const linkLayer = colorbarLayer.getLayerFromQueue("link");
  setOffsetsForLayer(linkLayer, mainLayout.offset);
  setClassNameForLayer(linkLayer, "linkLayer");
  registerLinkTransformer();
  Libra.GraphicalTransformer.initialize("linkTransformer", {
    layer: linkLayer,
    sharedVar: { links: links },
  });
  //#endregion

  //#region node layer
  const nodeLayer = linkLayer.getLayerFromQueue("node");
  setClassNameForLayer(nodeLayer, "nodeLayer");
  registerNodeTransformer();
  Libra.GraphicalTransformer.initialize("nodeTransformer", {
    layer: nodeLayer,
    sharedVar: { nodes, fieldColor, fieldRadius, scaleColor, scaleRadius },
  });
  //#endregion

  const service = Libra.InteractionService.initialize(
    "QuantitativeSelectionService"
  );
  service.setSharedVar("attrName", "degree");
  service._layerInstances = [nodeLayer]
  const highlightAttrValues = { stroke: "black", "stroke-width": 6 };
  service.transformers.add(
    // const transformer = Libra.GraphicalTransformer.initialize(
    "HighlightSelection",
    {
      transient: true,
      layer: nodeLayer.getLayerFromQueue("selectionLayer"),
      sharedVar: {
        highlightAttrValues,
      },
    }
  );

  async function refreshNodeLink (extent = [0, 0]) {
    await service.setSharedVar("extent", extent, { layer: nodeLayer });
    // transformer.redraw();
  }

  return [nodeLayer, service, null, refreshNodeLink];
}

function renderHistogramView (
  rootView,
  layout,
  data,
  key,
  nodeLayer,
  nodeLinkService,
  nodeLinkTransformer,
  refreshNodeLink
) {
  const { offset, width, height, margin } = layout;
  // const groupView = root
  // .append("g")
  // .attr("class", "histogramView")
  // .attr("transform", `translate(${offset.x}, ${offset.y})`);
  // const groupView = d3
  //   .select(histogramViewLayer.getGraphic())
  //   .attr("transform", `translate(${offset.x}, ${offset.y})`);

  const padding = 1;

  //#region  bin
  const extent = d3.extent(data, (d) => d[key]);
  const bin = d3
    .bin()
    .domain(extent)
    .value((d) => d[key]);
  // if (finestBin)
  bin.thresholds(d3.ticks(extent[0], extent[1] + 1, extent[1] - extent[0]));
  const binnedData = bin(data);
  // trick
  binnedData[binnedData.length - 1].x1++;
  //#endregion

  // scales
  const scaleX = d3
    .scaleLinear()
    .domain(extent)
    .range([margin.left, width - margin.right])
    .nice()
    .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain([0, d3.max(binnedData, (d) => d.length)])
    .range([height - margin.bottom, margin.top])
    .nice()
    .clamp(true);

  //#region 1 background view
  //#region 1.1 background layer
  const backgroundLayer = Libra.Layer.initialize("D3Layer", {
    name: "histogramBackground",
    width: width,
    height: height,
    container: rootView.getGraphic(),
  });
  setClassNameForLayer(backgroundLayer, "backgroundLayer");
  //#endregion
  //#region 1.2 background mark transformer
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
  //#endregion
  //#region 1.3 background axes transformer
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
  //#endregion

  //#region 2 histogram view
  //#region 2.1 histogram layer
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "histogramMain",
    width: layout.width,
    height: layout.height,
    container: rootView.getGraphic(),
  });
  setClassNameForLayer(mainLayer, "mainLayer");
  //#endregion
  //#region 2.2 histogram transformer
  registerHistogramTransformer();
  Libra.GraphicalTransformer.initialize("histogramTransformer", {
    layer: mainLayer,
    sharedVar: {
      scaleX: scaleX,
      scaleY: scaleY,
      binnedData: binnedData,
      padding: padding,
      fill: "grey",
      y: margin.top,
      height: height - margin.top,
    },
  });
  //#endregion
  //#endregion

  /** 2.3 instrument */
  const highlightAttrValues = { fill: "steelblue" };
  const brushXInstrument = Libra.Instrument.initialize("BrushXInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      //targetLayer: mainLayer,
      scaleX,
      highlightAttrValues,
      y: margin.top,
      height: height - margin.bottom,
      linking: nodeLinkService,
      linkProps: ['extent']
    },
  });

  // brushXInstrument.on(
  //   ["dragstart", "drag", "dragend"],
  //   async ({ instrument }) => {
  //     const [x] = instrument.services.getSharedVar("x", { mainLayer });
  //     const [width] = instrument.services.getSharedVar("width", { mainLayer });
  //     const bbox = mainLayer.getGraphic().getBoundingClientRect();
  //     const extent = [x, x + width].map((d) => d - bbox.x).map(scaleX.invert);
  //     // console.log(extent);
  //     // refreshNodeLink(extent);
  //     nodeLinkService.setSharedVar('extent', extent, { layer: nodeLayer })
  //     // await refreshNodeLink(extent);
  //     // setTimeout(() => refreshNodeLink(extent), 1)
  //   }
  // );

  brushXInstrument.on("dragend", Libra.Command.initialize('PersistExtent', {
    execute: () => {

    },
    feedback: [() => {

    }]
  }))
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

      const nodes = transformer.getSharedVar("nodes");
      const root = d3.select(layer.getGraphic());

      root
        .append("g")
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("fill", (d) => (d.children ? null : scaleColor(d[fieldColor])))
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
      const links = transformer.getSharedVar("links");
      const root = d3.select(layer.getGraphic());
      root
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
    },
  });
}

function registerGradientRectTransformer () {
  Libra.GraphicalTransformer.register("gradientRectTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const height = transformer.getSharedVar("height") ?? 0;
      const width = transformer.getSharedVar("width") ?? 0;
      const scaleColor =
        transformer.getSharedVar("scaleColor") ?? (() => "black");
      const margin = transformer.getSharedVar("margin") ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      const vertical = transformer.getSharedVar("vertical") ?? false;
      const reverse = transformer.getSharedVar("reverse") ?? false;

      const domain = scaleColor.domain();

      const graidentID = "gradient";
      const root = d3.select(layer.getGraphic());
      const gradient = root
        .append("defs")
        .append("linearGradient")
        .attr("id", graidentID);

      if (vertical) {
        gradient.attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
      }

      let newDomain = domain;
      if (!reverse) newDomain = domain.reverse();
      newDomain.forEach((value, i) => {
        gradient
          .append("stop")
          .attr("offset", `${(i / (domain.length - 1)) * 100}%`)
          .attr("stop-color", scaleColor(value));
      });

      root
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", `url(#${graidentID})`);
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

function registerHistogramTransformer () {
  Libra.GraphicalTransformer.register("histogramTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const binnedData = transformer.getSharedVar("binnedData");
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

function setOffsetsForLayer (layer, offset) {
  d3.select(layer.getGraphic()).attr(
    "transform",
    `translate(${offset.x}, ${offset.y})`
  );
}
function setClassNameForLayer (layer, className) {
  d3.select(layer.getGraphic()).attr("class", className);
}
