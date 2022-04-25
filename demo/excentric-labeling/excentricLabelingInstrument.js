const { Instrument, Layer, Interactor, SelectionService } = Libra;

const tooltipClassName = "tooltip";
const lensClassName = "lens";
const labelsClassName = "labels";

Instrument.register("ExcentricLabelingInstrument", {
  constructor: Instrument,
  interactors: ["MousePositionInteractor", "TouchPositionInteractor"],
  sharedVar: {
    lensRadius: 20,
    stroke: "green",
    strokeWidth: 2,
    countLabelDistance: 20,
    fontSize: 12,
    countLabelWidth: 40,
    maxLabelsNum: 10,
    labelAccessor: (d) => d["label"],
    colorAccessor: (d) => d["color"],
  },
  on: {
    enter: [
      async ({ event, layer, instrument }) => {
        if (event.changedTouches) event = event.changedTouches[0];
        const transformers =
          Libra.GraphicalTransformer.findTransformer("lensTransformer");
        transformers.forEach((tf) => {
          tf.setSharedVar("opacity", 1);
        });
      },
    ],
    hover: [
      Libra.Command.initialize("circleQuery", {
        execute: async ({ event, layer, instrument }) => {
          if (event.changedTouches) event = event.changedTouches[0];
          const services = instrument.services.find("SelectionService");
          // services.setSharedVar("x", layerX, { layer });
          // services.setSharedVar("y", layerY, { layer });
          services.setSharedVar("x", event.clientX, { layer });
          services.setSharedVar("y", event.clientY, { layer });
          // await Promise.all(instrument.services.results);
        },
        feedback: [
          // selection layer
          async ({ event, layer, instrument }) => {
            await Promise.all(instrument.services.results);
          },
          // lens layer
          async ({ event, layer, instrument }) => {
            if (event.changedTouches) event = event.changedTouches[0];
            const [x, y] = d3.pointer(event, layer.getGraphic());
            const services = instrument.services.find("SelectionService");
            const count = services.results[0].length;
            const transformers =
              Libra.GraphicalTransformer.findTransformer("lensTransformer");
            transformers.forEach((tf) => {
              tf.setSharedVar("cx", x);
              tf.setSharedVar("cy", y);
              tf.setSharedVar("count", count);
            });
          },
          // lines and labels layer
          async ({ event, layer, instrument }) => {
            if (event.changedTouches) event = event.changedTouches[0];
            const labelAccessor = instrument.getSharedVar("labelAccessor");
            const colorAccessor = instrument.getSharedVar("colorAccessor");
            const r = instrument.getSharedVar("lensRadius");
            const maxLabelsNum = instrument.getSharedVar("maxLabelsNum");
            const [layerX, layerY] = d3.pointer(event, layer.getGraphic());

            const services = instrument.services.find("SelectionService");
            const circles = services.results[0];

            const rawInfos = getRawInfos(circles, labelAccessor, colorAccessor);
            computeSizeOfLabels(rawInfos, d3.select(layer.getGraphic()));
            const compute = excentricLabeling()
              .radius(r)
              .horizontallyCoherent(true)
              .maxLabelsNum(maxLabelsNum);
            const layoutInfos = compute(rawInfos, layerX, layerY);

            const transformers = Libra.GraphicalTransformer.findTransformer(
              "linesAndLabelsTransformer"
            );
            transformers.forEach((tf) => {
              tf.setSharedVar("layoutInfos", layoutInfos);
            });
          },
        ],
      }),
    ],
    leave: [
      async ({ event, layer, instrument }) => {
        if (event.changedTouches) event = event.changedTouches[0];
        const transformers =
          Libra.GraphicalTransformer.findTransformer("lensTransformer");
        transformers.forEach((tf) => {
          tf.setSharedVar("opacity", 0);
        });
      },
    ],
  },
  preAttach: (instrument, layer) => {
    const lensRadius = instrument.getSharedVar("lensRadius");
    const stroke = instrument.getSharedVar("stroke");
    const strokeWidth = instrument.getSharedVar("strokeWidth");
    const countLabelDistance = instrument.getSharedVar("countLabelDistance");
    const countLabelWidth = lensRadius * 2;

    const fontSize = instrument.getSharedVar("fontSize");

    const services = instrument.services.find(
      "SelectionService",
      "CircleSelectionService"
    );
    instrument.services.forEach((service) => {
      service._layerInstances.push(layer);
    });
    services.setSharedVar("r", lensRadius);

    registerLensTransformer();
    const lensTransformer = Libra.GraphicalTransformer.initialize(
      "lensTransformer",
      {
        transient: true,
        layer: layer.getLayerFromQueue("lensLayer"),
        sharedVar: {
          lensRadius,
          stroke,
          strokeWidth,
          countLabelDistance,
          countLabelWidth,
          fontSize,
        },
      }
    );

    registerLinesAndLabelsTransformer();
    Libra.GraphicalTransformer.initialize("linesAndLabelsTransformer", {
      layer: layer.getLayerFromQueue("selectionLayer"),
      sharedVar: {
        layoutInfos: [],
      },
    });
  },
});

function registerLensTransformer () {
  Libra.GraphicalTransformer.register("lensTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      cx: 0,
      cy: 0,
      count: 0,
      opacity: 1,
      lensRadius: 20,
      stroke: "green",
      strokeWidth: 2,
      countLabelDistance: 20,
      fontSize: 12,
      countLabelWidth: 40,
    },
    redraw ({ layer, transformer }) {
      const cx = transformer.getSharedVar("cx");
      const cy = transformer.getSharedVar("cy");
      const opacity = transformer.getSharedVar("opacity");
      const lensRadius = transformer.getSharedVar("lensRadius");
      const stroke = transformer.getSharedVar("stroke");
      const strokeWidth = transformer.getSharedVar("strokeWidth");
      const count = transformer.getSharedVar("count");
      const countLabelDistance = transformer.getSharedVar("countLabelDistance");
      const fontSize = transformer.getSharedVar("fontSize");
      const countLabelWidth = transformer.getSharedVar("countLabelWidth");

      const root = d3.select(layer.getGraphic());
      root.selectAll("*").remove();

      const group = root
        .append("g")
        .attr("opacity", opacity)
        .attr("transform", `translate(${cx}, ${cy})`);

      debugger;
      group
        .append("circle")
        .attr("class", "lensCircle")
        .attr("cx", 0)
        .attr("r", lensRadius)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth);
      const countLabel = group
        .append("text")
        .attr("y", -(countLabelDistance + lensRadius))
        .attr("font-size", fontSize)
        .attr("text-anchor", "middle")
        .attr("fill", stroke)
        .text(count);
      const countLabelBBox = countLabel.node().getBBox();
      group
        .append("rect")
        .attr("class", "lensLabelBorder")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none")
        .attr("x", -countLabelWidth >> 1)
        .attr("y", countLabelBBox.y)
        .attr("width", countLabelWidth)
        .attr("height", countLabelBBox.height);
      group
        .append("line")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("y1", -lensRadius)
        .attr("y2", countLabelBBox.y + countLabelBBox.height);
    },
  });
}

function registerLinesAndLabelsTransformer () {
  Libra.GraphicalTransformer.register("linesAndLabelsTransformer", {
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      layoutInfos: [],
    },
    redraw ({ layer, transformer }) {
      const layoutInfos = transformer.getSharedVar("layoutInfos");
      const root = d3.select(layer.getGraphic());
      renderLines(root, layoutInfos);
      renderBBoxs(root, layoutInfos);
      renderTexts(root, layoutInfos);
    },
  });
}

function renderLines (root, layoutInfos) {
  const lineGroup = root.append("g").attr("class", "exentric-labeling-line");
  const lineGenerator = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);
  lineGroup
    .selectAll("path")
    .data(layoutInfos)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("d", (layoutInfo) => lineGenerator(layoutInfo.controlPoints));
}

function renderBBoxs (root, layoutInfos) {
  const bboxGroup = root.append("g").attr("class", "exentric-labeling-bbox");
  bboxGroup
    .selectAll("rect")
    .data(layoutInfos)
    .join("rect")
    .attr("class", "labelBBox")
    .attr("fill", "none")
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
    .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
    .attr("width", (layoutInfo) => layoutInfo.labelBBox.width)
    .attr("height", (layoutInfo) => layoutInfo.labelBBox.height);
}

function renderTexts (root, layoutInfos) {
  const textGroup = root.append("g").attr("class", "exentric-labeling-text");
  textGroup
    .selectAll("text")
    .data(layoutInfos)
    .join("text")
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
    .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
    .attr("dominant-baseline", "hanging")
    .text((layoutInfo) => layoutInfo.rawInfo.labelName);
}

/************************* */
function renderLabelsAndLines (
  root,
  cx,
  cy,
  r,
  objs,
  maxLabelsNum,
  labelAccessor,
  colorAccessor
) {
  if (!objs || objs.length <= 0) {
    return 0;
  }
  const rawInfos = getRawInfos(objs, labelAccessor, colorAccessor);
  computeSizeOfLabels(rawInfos, root);
  const compute = excentricLabeling()
    .radius(r)
    .horizontallyCoherent(true)
    .maxLabelsNum(maxLabelsNum);
  const layoutInfos = compute(rawInfos, cx, cy);
  renderLines(root, layoutInfos);
  renderBBoxs(root, layoutInfos);
  renderTexts(root, layoutInfos);
  return layoutInfos.length;
}

function getRawInfos (objs, labelAccessor, colorAccessor) {
  const rawInfos = objs.map((obj) => {
    const bbox = obj.getBBox();
    const x = bbox.x + (bbox.width >> 1);
    const y = bbox.y + (bbox.height >> 1);
    const labelName = labelAccessor(obj); //d3.select(obj).datum()[labelField];
    const color = colorAccessor(obj); //colorScale(d3.select(obj).datum()[colorField]);
    return {
      x,
      y,
      labelWidth: 0,
      labelHeight: 0,
      color,
      labelName,
    };
  });
  return rawInfos;
}

function computeSizeOfLabels (rawInfos, root) {
  const tempInfoAttr = "labelText";
  const tempClass = "temp" + String(new Date().getMilliseconds());
  //const tempMountPoint = d3.create("svg:g").attr("class", tempClass);
  const tempMountPoint = root.append("svg:g").attr("class", tempClass);
  rawInfos.forEach(
    (rawInfo) =>
    (rawInfo[tempInfoAttr] = tempMountPoint
      .append("text")
      .attr("opacity", "0")
      .attr("x", -Number.MAX_SAFE_INTEGER)
      .attr("y", -Number.MAX_SAFE_INTEGER)
      .text(rawInfo.labelName)
      .node())
  );
  root.node().appendChild(tempMountPoint.node());
  rawInfos.forEach((rawInfo) => {
    const labelBBox = rawInfo[tempInfoAttr].getBBox();
    rawInfo.labelWidth = labelBBox.width;
    rawInfo.labelHeight = 21;
  });
  root.select("." + tempClass).remove();
  rawInfos.forEach((rawInfo) => delete rawInfo[tempInfoAttr]);
}
