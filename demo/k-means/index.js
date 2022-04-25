const { initCentroids, renderCentroids } = require("./kMeansLayer");
const { Instrument, Layer, InteractionService, Command, HistoryManager } =
  Libra;

main();
appendButton();

/**
 * @param {object} interactionParams
 * @param {string | number} interactionParams.lensRadius
 * @param {string | number} interactionParams.fontSize
 * @param {string | number} interactionParams.maxLabelsNum
 * @param {boolean} interactionParams.shouldVerticallyCoherent open the function: vertically coherent labeling.
 * @param {boolean} interactionParams.shouldHorizontallyCoherent open the function: horizontally coherent labeling.
 */
async function main() {
  /**************** cars dataset ****************/
  //const fields = ["Horsepower", "Acceleration", "Miles_per_Gallon"] //, "Weight_in_lbs"];
  // const data = (await d3.json("./data/cars.json"))
  //   .filter((d) => fields.every((f) => d[f]))
  //   .map((d) => Object.fromEntries(fields.map((f) => [f, d[f]])));

  /**************** iris dataset ****************/
  const fields = ["sepal_length", "sepal_width", "petal_length", "petal_width"];
  const data = await d3.csv("./data/bezdekIris.csv");

  /**************** gapminder dataset ****************/
  // const fields = ["pop", "life_expect", "fertility"];
  // const data = (await d3.json("./data/gapminder.json"))
  //   .filter((d) => fields.every((f) => d[f]))
  //   .map((d) => Object.fromEntries(fields.map((f) => [f, d[f]])));

  /**************** penguins dataset ****************/
  // const fields = ["culmen_length_mm","flipper_length_mm","body_mass_g"]
  // const data = (await d3.csv("./data/penguins.csv"))
  //   .filter((d) => fields.every((f) => d[f] && d[f]!="NaN"))
  //   .map((d) => Object.fromEntries(fields.map((f) => [f, d[f]])));

  //   

  // layout
  const width = 800;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const cellWidth = innerWidth / fields.length;
  const cellHeight = innerHeight / fields.length;

  /******************** rendering part *********************/
  const svg = d3
    .select("#igPlayground")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", `0 0 ${width} ${height}`);
  const root = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  const layerInfos = {};
  for (let x = 0; x < fields.length; x++) {
    const fieldX = fields[x];
    for (let y = 0; y < fields.length; y++) {
      const fieldY = fields[y];
      const cellOffsetX = x * cellWidth;
      const cellOffsetY = y * cellHeight;
      const cellRoot = root
        .append("g")
        .attr("class", "cell")
        .attr("transform", `translate(${cellOffsetX},${cellOffsetY})`);
      const [mainLayer, scaleX, scaleY] = renderScatterPlot(
        cellRoot,
        cellWidth,
        cellHeight,
        fieldX,
        fieldY,
        data
      );

      if (!layerInfos[fieldX]) layerInfos[fieldX] = {};
      if (!layerInfos[fieldX][fieldY]) layerInfos[fieldX][fieldY] = {};
      const layerInfo = layerInfos[fieldX][fieldY];
      layerInfo["cellRoot"] = cellRoot;
      layerInfo["layer"] = mainLayer;
      layerInfo["scaleX"] = scaleX;
      layerInfo["scaleY"] = scaleY;
    }
  }
  

  /******************** interaction part *********************/
  const fieldExtents = {};
  fields.forEach(
    (field) => (fieldExtents[field] = d3.extent(data, (d) => d[field]))
  );
  const scaleColor = d3
    .scaleOrdinal()
    .domain(fields.map((f, i) => i))
    .range(d3.schemeTableau10);
  //.range(["rgb(225,87,89)", "rgb(78,162,167)", "rgb(237,201,73)", ""]);
  const centroids = initCentroids(fieldExtents, fields.length, scaleColor);
  const kmLayers = [];
  const kMeansService = InteractionService.initialize("AnalysisService", {
    algorithm: ({ data, centroids }) => {
      const kMeansResult = kmeans(
        data.map((datum) => fields.map((field) => parseFloat(datum[field]))),
        centroids.length,
        {
          initialization: centroids.map((datum) =>
            fields.map((field) => datum[field])
          ),
        }
      );
      return kMeansResult;
    },
    params: {
      data,
      centroids,
    },
  });
  for (let x = 0; x < fields.length; x++) {
    const fieldX = fields[x];
    for (let y = 0; y < fields.length; y++) {
      const fieldY = fields[y];
      const layerInfo = layerInfos[fieldX][fieldY];
      const cellRoot = layerInfo["cellRoot"];
      const scatterLayer = layerInfo["layer"];
      //const scatterGroup = d3.select(scatterLayer.getGraphic());
      const scaleX = layerInfo["scaleX"];
      const scaleY = layerInfo["scaleY"];
      const kMeansLayer = Layer.initialize("KMeansLayer", {
        sharedVar: {
          extents: fieldExtents,
          centroids,
          scatterLayer,
          fieldX,
          fieldY,
          scaleX,
          scaleY,
          scaleColor,
        },
        services: [kMeansService],
        width: scatterLayer._width,
        height: scatterLayer._height,
        container: scatterLayer.getGraphic(),
      });
      const dragInstrument = Instrument.initialize("DragInstrument", {
        layers: [kMeansLayer],
      });

      dragInstrument.on("dragend", async ({ layer, instrument }) => {
        const fieldX = layer.getSharedVar("fieldX");
        const fieldY = layer.getSharedVar("fieldY");
        const scaleX = layer.getSharedVar("scaleX");
        const scaleY = layer.getSharedVar("scaleY");
        const offX = layer.services
          .find("SelectionService")
          .getSharedVar("offsetx")[0];
        const offY = layer.services
          .find("SelectionService")
          .getSharedVar("offsety")[0];
        const offDataX = Math.sign(offX) * scaleX.invert(Math.abs(offX));
        const offDataY =
          Math.sign(-offY) *
          (Math.max(...scaleY.domain()) - scaleY.invert(Math.abs(offY)));

        const result = await layer.services.find("SelectionService")[0]
          .oldResults;
        try {
          const centroid = result.filter((elem) => elem.tagName === "circle")[0]
            .__data__;
          const dataX = centroid[fieldX];
          const dataY = centroid[fieldY];
          setTimeout(() => {
            centroid[fieldX] = dataX + offDataX;
            centroid[fieldY] = dataY + offDataY;
            for (let layer of kmLayers) {
              const fieldX = layer.getSharedVar("fieldX");
              const fieldY = layer.getSharedVar("fieldY");
              const scaleX = layer.getSharedVar("scaleX");
              const scaleY = layer.getSharedVar("scaleY");
              const scaleColor = layer.getSharedVar("scaleColor");
              renderCentroids(
                d3.select(layer.getGraphic()),
                layer.getSharedVar("centroids"),
                fieldX,
                fieldY,
                scaleX,
                scaleY,
                scaleColor
              );
            }
          }, 0);
        } catch {}
      });
      dragInstrument.on("dragconfirm", ({ layer }) => {
        layer.services
          .find("AnalysisService")
          .setSharedVar("centroids", layer.getSharedVar("centroids"));
      });
      dragInstrument.on(
        "dragconfirm",
        Command.initialize("ShowKMeansResult", {
          execute: async function (options) {
            const { layer } = options;
            const result = await layer.services.find("AnalysisService")
              .results[0];
            const centroids = layer.getSharedVar("centroids");
            centroids.forEach((c, i) => {
              fields.forEach((field, fi) => {
                c[field] = result.centroids[i].centroid[fi];
              });
            });
            await HistoryManager.commit({ ...options, command: this });
          },
          feedback: [
            async ({ layer }) => {
              const result = await layer.services.find("AnalysisService")
                .results[0];
              for (const layer of kmLayers) {
                const fieldX = layer.getSharedVar("fieldX");
                const fieldY = layer.getSharedVar("fieldY");
                const scaleX = layer.getSharedVar("scaleX");
                const scaleY = layer.getSharedVar("scaleY");
                renderCentroids(
                  d3.select(layer.getGraphic()),
                  layer.getSharedVar("centroids"),
                  fieldX,
                  fieldY,
                  scaleX,
                  scaleY,
                  scaleColor
                );
                const scatterLayer = layer.getSharedVar("scatterLayer");
                const circles = d3.selectAll(
                  scatterLayer
                    .getVisualElements()
                    .filter((elem) => elem.tagName === "circle")
                );
                circles.attr("stroke", (_, i) =>
                  scaleColor(result.clusters[i])
                );
              }
            },
          ],
        })
      );
      layerInfo["kmLayer"] = kMeansLayer;
      kmLayers.push(kMeansLayer);
    }
  }
}

function renderScatterPlot(root, width, height, fieldX, fieldY, data) {
  // settings
  const radius = width / 60;
  const tickCount = 5;

  // layout
  const margin = { top: 10, right: 10, bottom: 50, left: 50 };
  // const innerWidth = width - margin.left - margin.right;
  // const innerHeight = height - margin.top - margin.bottom;

  // data manipulation
  data = data.filter((d) => !!(d[fieldX] && d[fieldY]));
  const extentX = [0, d3.max(data, (d) => d[fieldX])];
  const extentY = [0, d3.max(data, (d) => d[fieldY])];

  // scales
  const scaleX = d3
    .scaleLinear()
    .domain(extentX)
    .range([margin.left, width - margin.right])
    .nice(tickCount)
    .clamp(true);
  const scaleY = d3
    .scaleLinear()
    .domain(extentY)
    .range([height - margin.bottom, margin.top])
    .nice(tickCount)
    .clamp(true);

  const backgroundLayer = Layer.initialize("D3Layer", {
    width: innerWidth,
    height: innerHeight,
    container: root.node(),
  });
  registerAxesTransformer();
  Libra.GraphicalTransformer.initialize("axesTransformer", {
    layer: backgroundLayer,
    sharedVar: {
      width: width,
      height: height,
      margin: margin,
      scaleX: scaleX,
      scaleY: scaleY,
      titleX: fieldX,
      titleY: fieldY,
      tickCountX: tickCount,
      tickCountY: tickCount,
    },
  });

  const mainLayer = backgroundLayer.getLayerFromQueue("mainLayer");
  registerCirclesTransformer();
  Libra.GraphicalTransformer.initialize("circlesTransformer", {
    layer: backgroundLayer,
    sharedVar: {
      scaleX: scaleX,
      scaleY: scaleY,
      scaleColor: (d) => "black",
      fieldX: fieldX,
      fieldY: fieldY,
      radius: 5,
      opacity: 0.9,
      data: data,
    },
  });

  // mainLayer.setSharedVar("symbolsFilter", (elem) =>
  //   circles.nodes().includes(elem)
  // );
  // mainLayer.setSharedVar("scaleX", scaleX);
  // mainLayer.setSharedVar("scaleY", scaleX);
  // mainLayer.setSharedVar("fieldX", fieldX);
  // mainLayer.setSharedVar("fieldY", fieldY);
  return [mainLayer, scaleX, scaleY];
}

function registerCirclesTransformer() {
  Libra.GraphicalTransformer.register("circlesTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      // user can retrieve what sharedVars needed, and can copy and paste the list when initialized.
      scaleX: (d) => 0,
      scaleY: (d) => 0,
      scaleColor: (d) => "black",
      fieldX: "x",
      fieldY: "y",
      fieldColor: "color",
      radius: 5,
      opacity: 0.9,
    },
    redraw({ layer, transformer }) {
      const scaleColor = transformer.getSharedVar("scaleColor");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const fieldColor = transformer.getSharedVar("fieldColor");
      const fieldX = transformer.getSharedVar("fieldX");
      const fieldY = transformer.getSharedVar("fieldY");
      const radius = transformer.getSharedVar("radius");
      const opacity = transformer.getSharedVar("opacity");

      const data = transformer.getSharedVar("data");
      const root = d3.select(layer.getGraphic());

      const circles = root
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("opacity", opacity)
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr("stroke", (d) => scaleColor(d[fieldColor]))
        .attr("cx", (d) => scaleX(d[fieldX]))
        .attr("cy", (d) => scaleY(d[fieldY]))
        .attr("r", radius);
    },
  });
}

function registerAxesTransformer() {
  Libra.GraphicalTransformer.register("axesTransformer", {
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
      width: 0,
      height: 0,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scaleX: () => 0,
      scaleY: () => 0,
      titleX: "",
      titleY: "",
      tickCountX: null,
      tickCountY: null,
    },
    redraw({ layer, transformer }) {
      const width = transformer.getSharedVar("width");
      const height = transformer.getSharedVar("height");
      const margin = transformer.getSharedVar("margin");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const titleX = transformer.getSharedVar("titleX");
      const titleY = transformer.getSharedVar("titleY");
      const tickCountX = transformer.getSharedVar("tickCountX") ?? null;
      const tickCountY = transformer.getSharedVar("tickCountY") ?? null;

      const root = d3.select(layer.getGraphic());
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
        .call(d3.axisBottom(scaleX).ticks(tickCountX))
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
        .call(d3.axisLeft(scaleY).ticks(tickCountY))
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

function registerCentroidsTransformer() {
  Libra.GraphicalTransformer.register("circlesTransformer", {
    // layer: mainLayer,
    constructor: Libra.GraphicalTransformer,
    sharedVar: {
        centroids,
        fieldX,
        fieldY,
        scaleX,
        scaleY,
        scaleColor
    },
    redraw({ layer, transformer }) {
      const centroids = transformer.getSharedVar("centroids");
      const fieldX = transformer.getSharedVar("fieldX");
      const fieldY = transformer.getSharedVar("fieldY");
      const scaleX = transformer.getSharedVar("scaleX");
      const scaleY = transformer.getSharedVar("scaleY");
      const scaleColor = transformer.getSharedVar("scaleColor");

      const root = d3.select(layer.getGraphic());
      root.selectAll(".centroid").remove();
      const circles = root
        .selectAll("circle")
        .data(centroids)
        .join("circle")
        .attr("class", "centroid")
        .attr("fill", (centroid) => scaleColor(centroid.cluster))
        .attr("stroke", "black")
        .attr("strokeWidth", 1)
        .attr("opacity", 0.8)
        .attr("cx", (centroid) => scaleX(centroid[fieldX]))
        .attr("cy", (centroid) => scaleY(centroid[fieldY]))
        .attr("r", (scaleX.range()[1] - scaleX.range()[0]) / 20);
      function updateCentroids(centroids) {
        if (centroids) circles.data(centroids);
        circles
          .attr("cx", (centroid) => scaleX(centroid[fieldX]))
          .attr("cy", (centroid) => scaleY(centroid[fieldY]));
      }
    },
  });
}

function appendButton() {
  const undoBtn = document.createElement("button");
  undoBtn.addEventListener("click", () => {
    HistoryManager.undo();
  });
  undoBtn.innerText = "< Undo";

  const redoBtn = document.createElement("button");
  redoBtn.addEventListener("click", () => {
    HistoryManager.redo();
  });
  redoBtn.innerText = "Redo >";
  document.getElementById("igPlayground").appendChild(undoBtn);
  document.getElementById("igPlayground").appendChild(redoBtn);
}
