registerMapTransformer();
/*********************** 1. basic settings ******************/
const selectedColor = "#ffa477";
const nonSelectedColor = "#b7dbff";
const stroke = "#ececec";
const showNames = "toggle";
const fontColor = "#333333";
const backgroundColor = "#ffffff";

const styles = `
  .selected {
    fill: ${selectedColor};
  }


  g.counties path {
    stroke: ${stroke};
    stroke-width: 1px;
  }

  .county-names {
    visibility: ${showNames == "toggle" ? "visible" : "hidden"};
    fill: ${fontColor};
  }

  .background {
    fill: ${backgroundColor}
  }
  `;

d3.json("./data/ncmap_pop_density_topojson.json").then((nc) => {
  const data = topojson.feature(nc, nc.objects.ncmap).features;
  const width = 1000;
  const height = 400;

  /******************* 2. render static visualization with Libra.Layer ********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 width height`);

  svg.append("style").html(styles).attr("class", "mapStyles");

  svg
    .append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("class", "background");
  svg.on("click", () => {
    //
  });

  const scaleX = d3.scaleLinear().domain([0, 1]).range([0, 1]);
  const scaleY = d3.scaleLinear().domain([0, 1]).range([0, 1]);

  const mainLayer = Libra.Layer.initialize("D3Layer", {
    width,
    height,
    container: svg.node(),
  });

  Libra.GraphicalTransformer.initialize("mapTransformer", {
    layer: mainLayer,
    sharedVar: {
      data,
      scaleX,
      scaleY,
    },
  });

  Libra.Instrument.initialize("BrushInstrument", {
    layers: [{ layer: mainLayer, options: { pointerEvents: 'all' } }],
    sharedVar: {
      highlightAttrValues: { fill: "red" },
      selector: 'path',
      deepClone: true
    },
  });
  mainLayer.setLayersOrder({ "transientLayer": 2 });
});

function registerMapTransformer () {
  Libra.GraphicalTransformer.register("mapTransformer", {
    constructor: Libra.GraphicalTransformer,
    redraw ({ layer, transformer }) {
      const data = transformer.getSharedVar("data");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");

      const root = d3.select(layer.getGraphic()).attr("class", "groupMarks");

      const path = d3.geoPath();

      const counties = root
        .selectAll(".counties")
        .data(data)
        .join("g")
        .attr("class", "counties")
        .attr(
          "transform",
          `translate(${scaleX(0)}, ${scaleY(0)}) scale(${scaleX(1) - scaleX(0)
          })`
        );

      counties.selectChildren().remove();
      counties
        .append("path")
        .attr("d", path)
        .attr("fill", nonSelectedColor)
        .append("title")
        .text("counties");
      counties
        .append("text")
        .text((d) => d.properties.county)
        .attr("transform", function (d) {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]},${centroid[1]})`;
        })
        .style("pointer-events", "none")
        .attr("font-size", 8)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("class", "county-names");
    },
  });
}
