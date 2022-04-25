function moveDust(dustLayer) {
  const magnetLayer = dustLayer.getLayerFromQueue("magnetLayer");
  const magnets = d3.select(magnetLayer.getGraphic()).selectAll("circle");
  const dusts = d3.select(dustLayer.getGraphic()).selectAll("circle");
  d3.extent(dusts);

  for (const magnet of magnets.nodes()) {
    const dMagnet = d3.select(magnet);
    const magnetDatum = dMagnet.datum();
    const extent = d3.extent(
      dusts.data().map((datum) => datum[magnetDatum.property])
    );
    for (const dust of dusts.nodes()) {
      const dDust = d3.select(dust);
      const datum = dDust.datum();
      let x = parseFloat(dDust.attr("cx"));
      let y = parseFloat(dDust.attr("cy"));
      let dx = magnetDatum.x;
      let dy = magnetDatum.y;
      x += ((dx - x) * datum[magnetDatum.property]) / 100 / extent[1];
      y += ((dy - y) * datum[magnetDatum.property]) / 100 / extent[1];
      dDust.attr("cx", x);
      dDust.attr("cy", y);
    }
  }
  requestAnimationFrame(moveDust.bind(null, dustLayer));
}

function getRandomData(data, number = 10) {
  return data.sort(() => (Math.random() < 0.5 ? -1 : 1)).slice(0, number);
}

function render(root, width, height, data) {
  const radius = 10;

  const dustLayer = Libra.Layer.initialize("D3Layer", {
    name: "dustLayer",
    width,
    height,
    container: root.node(),
  });
  const bgtransformerName = registerBackgroundTranformer();
  Libra.GraphicalTransformer.initialize(bgtransformerName, {
    layer: dustLayer,
  });

  const magnetLayer = dustLayer.getLayerFromQueue("magnetLayer");
  const circleTransformerName = registerCirclesTranformer();
  Libra.GraphicalTransformer.initialize(circleTransformerName, {
    layer: dustLayer,
    sharedVar: {
      data: data,
      width: width,
      height: height,
      radius: radius,
    },
  });

  addCreateMagnetInstrument(dustLayer);

  return dustLayer;
}

function registerBackgroundTranformer() {
  const name = "backgroundTransformer";
  Libra.GraphicalTransformer.register(name, {
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const mainGroup = d3.select(layer.getGraphic());
      const background = mainGroup.select("rect");
      background.attr("fill", "#eee").attr("opacity", 1);
    },
  });
  return name;
}

function registerCirclesTranformer() {
  const name = "circlesTransformer";
  Libra.GraphicalTransformer.register(name, {
    constructor: Libra.GraphicalTransformer,
    redraw({ layer, transformer }) {
      const data = transformer.getSharedVar("data");
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const radius = transformer.getSharedVar("radius");

      const mainGroup = d3.select(layer.getGraphic());

      mainGroup
        .selectAll("circle")
        .data(data)
        .join("circle")
        .classed("dust", true)
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", radius);
    },
  });
  return name;
}

const properties = [];
const magnets = [];
let rootData = null;
async function main() {
  const cars = await d3.json("./data/cars.json");

  rootData = getRandomData(cars);

  const width = 800,
    height = 600;

  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  const dustLayer = render(svg, width, height, rootData);

  requestAnimationFrame(moveDust.bind(null, dustLayer));

  /***** add interaction *****/
  const datum = rootData[0];
  for (const property in datum) {
    const value = datum[property];
    if (typeof value === "number") {
      properties.push(property);
    }
  }

  const dragOption = {
    layer: dustLayer.getLayerFromQueue("magnetLayer"),
    options: { pointerEvents: "visible" },
  };
  const dragInstrument = Libra.Instrument.initialize("DragInstrument", {
    layers: [dragOption],
    sharedVar: {
      deepClone: true,
    },
  });
  dragInstrument.on("dragstart", () => {
    dragOption.options.pointerEvents = "all";
  });
  dragInstrument.on("dragend", async ({ layer, instrument }) => {
    dragOption.options.pointerEvents = "visible";
    const result = await instrument.services.find("SelectionService")[0]
      .oldResults;
    const gRaw = result.find(
      (node) => node.tagName == "g" && d3.select(node).datum()
    );
    if (gRaw) {
      const g = d3.select(gRaw);
      const datum = g.datum();
      const sm = instrument.services.find("SelectionService")[0];
      let x = sm.getSharedVar("offsetx");
      let y = sm.getSharedVar("offsety");
      datum.x += x;
      datum.y += y;
      g.datum(datum);
      g.select("circle")
        .datum(datum)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
      g.select("text")
        .datum(datum)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);
    }
  });
}

function addCreateMagnetInstrument(dustLayer) {
  // const name = "createMagnet";

  Libra.Instrument.initialize("ClickInstrument", {
    layers: [{ layer: dustLayer, options: { pointerEvents: "all" } }],
    on: {
      click: [
        ({ layer, event }) => {
          let x = event.clientX;
          let y = event.clientY;
          const baseBBox = layer.getGraphic().getBoundingClientRect();
          x -= baseBBox.x;
          y -= baseBBox.y;
          const magnetLayer = layer.getLayerFromQueue("magnetLayer");
          layer.setLayersOrder({
            magnetLayer: 1,
          });
          const data =
            d3.select(magnetLayer.getGraphic()).selectAll("g").data() || [];
          const descriptor = {
            x,
            y,
            property: properties[data.length % (properties.length - 1)],
          };
          data.push(descriptor);
          magnets.push(descriptor);
          d3.select(magnetLayer.getGraphic()).select("rect").remove();
          const g = d3
            .select(magnetLayer.getGraphic())
            .selectAll("g")
            .data(data)
            .enter()
            .append("g");
          g.append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 30)
            .attr("fill", "red");
          g.append("text")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("text-anchor", "middle")
            .text((d) => d.property);
          layer.setLayersOrder({
            magnetLayer: 1,
            selectionLayer: -1,
            // transientLayer: -1,
          });
        },
      ],
    },
  });
}

main();
