// import static visualization and global variables
const VIS = require("./staticVisualization");

async function main() {
  await VIS.loadData();
  VIS.renderStaticVisualization();
  const mainLayer = renderMainVisualization();
  mountInteraction(mainLayer);
}

function renderMainVisualization() {
  // Find the SVG element on page
  const svg = d3.select("#LibraPlayground svg");

  // Create the main layer
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    name: "mainLayer",
    width: globalThis.WIDTH,
    height: globalThis.HEIGHT,
    offset: {
      x: globalThis.VIEW_LAYOUTS.nodelink.margin.left,
      y: globalThis.VIEW_LAYOUTS.nodelink.margin.top,
    },
    container: svg.node(),
  });
  const g = d3.select(mainLayer.getGraphic());

  // Draw nodes
  g.selectAll("circle")
    .data(globalThis.data.nodes)
    .join("circle")
    .attr("class", "mark")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", "steelblue")
    .attr("stroke", "#000")
    .attr("r", (d) => globalThis.radius(d.degree));

  return mainLayer;
}

function mountInteraction(layer) {
  Libra.Interaction.build({
    inherit: "ClickInstrument",
    layers: [layer],
    remove: [
      {
        find: "SelectionTransformer",
      },
    ],
    insert: [
      {
        find: "SelectionService",
        flow: [
          {
            comp: "FilterService",
            sharedVar: {
              fields: ["group"],
            },
          },
          {
            comp: "SelectionTransformer",
            layer: layer.getLayerFromQueue("selectionLayer"),
          },
        ],
      },
    ],
    sharedVar: {
      highlightAttrValues: {
        stroke: "orange",
        "stroke-width": 3,
      },
    },
  });
}

main();