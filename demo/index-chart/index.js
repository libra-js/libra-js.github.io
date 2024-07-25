// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  VIS.renderStaticVisualization();
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization(
  scaleY = globalThis.y,
  data = globalThis.data
) {
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  let returnVal = null;
  let g = svg.select(".main");
  if (g.empty()) {
    const mainLayer = Libra.Layer.initialize("D3Layer", {
      name: "mainLayer",
      width: globalThis.WIDTH,
      height: globalThis.HEIGHT,
      offset: { x: globalThis.MARGIN.left, y: globalThis.MARGIN.top },
      container: svg.node(),
    });
    g = d3.select(mainLayer.getGraphic()).attr("class", "main");

    returnVal = mainLayer;
  }
  g.selectChildren().remove();

  const line = d3
    .line()
    .x((d) => globalThis.x(d.date))
    .y((d) => scaleY(d.k));

  g.append("g")
    .call(d3.axisLeft(scaleY).tickFormat(d3.format(".0%")))
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("x2", globalThis.WIDTH)
    );

  g.append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("stroke", (d) => globalThis.color(d[0]))
    .datum((d) => d[1])
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", (d) => line(d));

  return returnVal;
}

function mountInteraction(layer) {
  // Initialize Main Transformer
  const mainTransformer = Libra.GraphicalTransformer.initialize(
    "MainTransformer",
    {
      layer,
      sharedVar: {
        result: { scaleY: globalThis.y, data: globalThis.data },
      },
      redraw({ transformer }) {
        const { scaleY, data } = transformer.getSharedVar("result");
        renderMainVisualization(scaleY, data);
      },
    }
  );

  // Initialize Service
  const normalizationService = Libra.Service.initialize(
    "NormalizationService",
    {
      constructor: Libra.Service.AnalysisService,
      transformers: [mainTransformer],
      sharedVar: { point: 0 },
      evaluate({ point }) {
        const date = globalThis.x.invert(point);
        const data = JSON.parse(JSON.stringify(globalThis.data));
        data.forEach(([_, items]) => {
          if (items.length > 0) {
            items.forEach(({ date }, i) => {
              items[i].date = new Date(date);
            });
            let leftItemIndex = 0;
            let rightItemIndex = 0;
            for (let i = 1; i < items.length; ++i) {
              const item = items[i];
              if (date <= item.date) {
                leftItemIndex = i - 1;
                rightItemIndex = i;
                break;
              }
            }
            const leftItem = items[leftItemIndex];
            const rightItem = items[rightItemIndex];
            const a =
              leftItem.date === rightItem.date
                ? 1
                : (date - leftItem.date) / (rightItem.date - leftItem.date);
            let baseValue = leftItem.value * a + rightItem.value * (1 - a);
            items.forEach(({ value }, i) => {
              items[i].k = value / baseValue;
            });
          }
        });

        const scaleY = globalThis.y.copy();
        scaleY.domain(
          d3.extent(
            data.flatMap((d) => d[1]),
            (d) => d.k
          )
        );

        return { scaleY, data };
      },
    }
  );

  // Attach HelperLineInstrument to the main layer
  const helperLineInstrument = Libra.Instrument.initialize(
    "HelperLineInstrument",
    {
      layers: [layer],
      services: [normalizationService],
      sharedVar: {
        orientation: ["vertical"],
        style: {
          stroke: "black",
        },
      },
    }
  );

  helperLineInstrument.on("hover", function ({ instrument }) {
    const barX = instrument.getSharedVar("x") - globalThis.MARGIN.left;
    instrument.services.setSharedVar("point", barX);
  });
}

main();
