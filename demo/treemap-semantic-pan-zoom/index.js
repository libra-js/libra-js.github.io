registerTreemapTransformer();
main();

async function main () {
  const data = await d3.json("./data/flare-2.json");

  /*********************** 1. basic settings ******************/
  const width = 500,
    height = 380;

  /******************* 2. render visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  const mainLayer = renderTreemap(svg, width, height, data);

}

/**
 * @param {d3.Selection<SVGGElement, unknown, unknown, unknown>} root
 * @param {number} width
 * @param {number} height
 * @param {unknown[]} data
 * @returns
 */
function renderTreemap (root, width, height, data) {
  const dataRoot = d3.hierarchy(data).sum(function (d) {
    return d.value;
  });

  d3.treemap().size([width, height]).padding(2)(dataRoot);

  const scaleX = d3.scaleLinear().domain([0, 1]).range([0, 1]);
  const scaleY = d3.scaleLinear().domain([0, 1]).range([0, 1]);
  const scaleColor = d3
    .scaleSequential()
    .domain([0, dataRoot.value])
    .interpolator(d3.interpolateReds);

  const minZoomLevel = 0;
  const maxZoomLevel = 2;
  const mainLayer = Libra.Layer.initialize("D3Layer", {
    width,
    height,
    container: root.node(),
  });
  const treemapTransformer = Libra.GraphicalTransformer.initialize("treemap", {
    layer: mainLayer,
    sharedVar: {
      scaleX,
      scaleY,
      scaleColor,
      dataRoot,
      width,
      height,
    },
  });

  Libra.Instrument.initialize("PanInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      // fixRange: true,
      transformers: [treemapTransformer],
    }
  });
  Libra.Instrument.initialize("ZoomInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      // fixRange: true,
      transformers: [treemapTransformer],
    }
  });

  return mainLayer;
}

function registerTreemapTransformer () {
  Libra.GraphicalTransformer.register("treemap", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const scaleColor = transformer.getSharedVar("scaleColor");
      const dataRoot = transformer.getSharedVar("dataRoot");
      const originalRangeX = 1;
      const rangeX = scaleX.range();
      const zoomScale = (rangeX[1] - rangeX[0]) / originalRangeX;
      const zoomLevel = Math.min(Math.round(zoomScale) - 0, 2);
      
      
      

      let data = [dataRoot];
      for (let i = 0; i < zoomLevel; ++i) {
        data = data.flatMap((node) => node.children || []);
      }
      scaleColor.domain([0, d3.max(data, (d) => d.value)]);
      const root = d3.select(layer.getGraphic()).attr("class", "groupMarks");
      const blocks = root
        .selectAll(".block")
        .data(data)
        .join("g")
        .attr("class", "block");

      blocks.selectChildren().remove();
      blocks
        .append("rect")
        .attr("fill", function (d) {
          return scaleColor(d.value);
        })
        .attr("x", function (d) {
          return scaleX(d.x0);
        })
        .attr("y", function (d) {
          return scaleY(d.y0);
        })
        .attr("width", function (d) {
          return scaleX(d.x1) - scaleX(d.x0);
        })
        .attr("height", function (d) {
          return scaleY(d.y1) - scaleY(d.y0);
        });

      blocks
        .append("text")
        .attr("x", function (d) {
          return scaleX(d.x0 + 5);
        }) // +10 to adjust position (more right)
        .attr("y", function (d) {
          return scaleY(d.y0 + 20);
        }) // +20 to adjust position (lower)
        .text(function (d) {
          return d.data.name;
        })
        .attr("font-size", "15px")
        .attr("fill", "white");
    },
  });
}
