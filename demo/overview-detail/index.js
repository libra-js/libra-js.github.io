registerAreaTransformer();
registerAxesTransformer();
main();

async function main() {
  const timeParser = d3.timeParse("%b %d %Y");
  const fieldX = "date";
  const fieldY = "price";
  const data = (await d3.json("./data/stocks/stocks2.json")).map((d) => ({
    [fieldX]: timeParser(d.date),
    [fieldY]: +d.price,
  }));

  const width = 764,
    height = 532;

  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const layoutTop = {
    width: width,
    height: height * 0.7,
    margin: { top: 30, right: 10, bottom: 50, left: 70 },
  };
  const layoutBottom = {
    width: width,
    height: height - layoutTop.height,
    margin: { top: 30, right: 10, bottom: 50, left: 70 },
  };

  const groupTop = svg.append("g").classed("groupTop", true);
  const groupBottom = svg
    .append("g")
    .classed("groupTop", true)
    .attr("transform", `translate(${0}, ${layoutTop.height})`);

  const {
    axesTransformer: axesTransformerTop,
    areaTransformer: areaTransformerTop,
    scaleX: scaleXTop,
  } = renderAreaChart(groupTop, layoutTop, data, fieldX, fieldY);
  const { mainLayer: mainLayerBottom, scaleX: scaleXBottom } = renderAreaChart(
    groupBottom,
    layoutBottom,
    data,
    fieldX,
    fieldY
  );

  const brushXInstrument = Libra.Instrument.initialize("DataBrushXInstrument", {
    layers: [{ layer: mainLayerBottom, options: { pointerEvents: "all" } }],
    sharedVar: {
      y: layoutBottom.margin.top,
      height:
        layoutBottom.height -
        layoutBottom.margin.bottom -
        layoutBottom.margin.top,
      scaleX: scaleXBottom,
      attrNameX: fieldX,
      extentX: scaleXBottom.domain(),
    },
  });

  brushXInstrument.on(
    ["dragstart", "drag", "dragend"],
    async ({ instrument }) => {
      const scaleX = areaTransformerTop.getSharedVar("scaleX");
      const [extent] = instrument.services.getSharedVar("extent");
      scaleXTop.domain(extent);
      areaTransformerTop.setSharedVar("scaleX", scaleX);
      axesTransformerTop.setSharedVar("scaleX", scaleX);
    }
  );
}

function renderAreaChart(root, layout, data, fieldX, fieldY) {
  const { width, height, margin } = layout;

  const domainX = d3.extent(data, (d) => d[fieldX]);
  const domainY = [0, d3.max(data, (d) => d[fieldY])];

  const scaleX = d3
    .scaleTime()
    .domain(domainX)
    .range([margin.left, width - margin.right])
    .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain(domainY)
    .range([height - margin.bottom, margin.top])
    .nice();

  const backgroundLayer = Libra.Layer.initialize("D3Layer", {
    name: "background",
    width: width,
    height: height,
    container: root.node(),
  });
  const axesTransformer = Libra.GraphicalTransformer.initialize(
    "axesTransformer",
    {
      layer: backgroundLayer,
      sharedVar: {
        width: width,
        height: height,
        margin: margin,
        scaleX: scaleX,
        scaleY: scaleY,
        titleX: fieldX,
        titleY: fieldY,
      },
    }
  );

  const mainLayer = backgroundLayer.getLayerFromQueue("main");
  const areaTransformer = Libra.GraphicalTransformer.initialize(
    "areaTransformer",
    {
      layer: mainLayer,
      sharedVar: {
        scaleX: scaleX,
        scaleY: scaleY,
        fieldX: fieldX,
        fieldY: fieldY,
        data: data,
      },
    }
  );

  return {
    mainLayer,
    backgroundLayer,
    axesTransformer,
    areaTransformer,
    scaleX,
    scaleY,
  };
}

function registerAreaTransformer() {
  Libra.GraphicalTransformer.register("areaTransformer", {
    constructor: Libra.GraphicalTransformer,
    sharedVar: {},
    redraw({ layer, transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const fieldX = transformer.getSharedVar("fieldX");
      const fieldY = transformer.getSharedVar("fieldY");
      const data = transformer.getSharedVar("data");

      const root = d3.select(layer.getGraphic());
      root.selectAll("*").remove();

      const areaGenerator = d3
        .area()
        .x((d) => scaleX(d[fieldX]))
        .y0(scaleY(0))
        .y1((d) => scaleY(d[fieldY]));

      root
        .append("g")
        .classed("marks", true)
        .append("path")
        .attr("fill", "steelblue")
        .attr("d", areaGenerator(data));
    },
  });
}

function registerAxesTransformer() {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      titleX: "",
      titleY: "",
    },
    redraw({ layer, transformer }) {
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
