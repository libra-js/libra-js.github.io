// global constants
globalThis.START_YEAR = 1980;

// global variables
globalThis.data = [];
globalThis.year = globalThis.START_YEAR;
globalThis.vegaSpec = {};
globalThis.vegaView = null;

// shared scales
globalThis.x = null;
globalThis.y = null;

async function loadData() {
  //Read the data
  globalThis.data = await d3.json("./data/gapminder.json");
  globalThis.interpolatedData = globalThis.data.filter(
    (x) => x.year === globalThis.year
  );

  globalThis.vegaSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description:
      "An interactive scatter plot of global health statistics by country and year.",
    width: 800,
    height: 600,
    padding: 5,

    data: [
      {
        name: "gapminder",
        values: globalThis.data,
      },
      {
        name: "interpolatedData",
        values: globalThis.interpolatedData,
      },
      {
        name: "year",
        values: [globalThis.year],
      },
      {
        name: "clusters",
        values: [
          { id: 0, name: "South Asia" },
          { id: 1, name: "Europe & Central Asia" },
          { id: 2, name: "Sub-Saharan Africa" },
          { id: 3, name: "America" },
          { id: 4, name: "East Asia & Pacific" },
          { id: 5, name: "Middle East & North Africa" },
        ],
      },
    ],

    scales: [
      {
        name: "x",
        type: "linear",
        nice: true,
        domain: { data: "gapminder", field: "fertility" },
        range: "width",
      },
      {
        name: "y",
        type: "linear",
        nice: true,
        zero: false,
        domain: { data: "gapminder", field: "life_expect" },
        range: "height",
      },
      {
        name: "color",
        type: "ordinal",
        domain: { data: "gapminder", field: "cluster" },
        range: "category",
      },
      {
        name: "label",
        type: "ordinal",
        domain: { data: "clusters", field: "id" },
        range: { data: "clusters", field: "name" },
      },
    ],

    axes: [
      {
        title: "Fertility",
        orient: "bottom",
        scale: "x",
        grid: true,
        tickCount: 5,
      },
      {
        title: "Life Expectancy",
        orient: "left",
        scale: "y",
        grid: true,
        tickCount: 5,
      },
    ],

    legends: [
      {
        fill: "color",
        title: "Region",
        orient: "right",
        encode: {
          symbols: {
            enter: {
              fillOpacity: { value: 0.5 },
            },
          },
          labels: {
            update: {
              text: { scale: "label", field: "value" },
            },
          },
        },
      },
    ],

    marks: [
      {
        type: "text",
        encode: {
          update: {
            text: { signal: "data('year')[0].data" },
            x: { value: 300 },
            y: { value: 300 },
            fill: { value: "grey" },
            fillOpacity: { value: 0.25 },
            fontSize: { value: 100 },
          },
        },
      },
      {
        name: "point",
        type: "symbol",
        from: { data: "interpolatedData" },
        encode: {
          enter: {
            fill: { scale: "color", field: "cluster" },
            size: { value: 150 },
          },
          update: {
            x: { scale: "x", field: "fertility" },
            y: { scale: "y", field: "life_expect" },
            fillOpacity: { value: 0.5 },
          },
        },
      },
    ],
  };
}

async function renderStaticVisualization() {
  // render vega spec on screen
  const { view } = await vega(
    document.getElementById("LibraPlayground"),
    globalThis.vegaSpec
  );

  globalThis.vegaView = view;
  globalThis.x = view.scale("x");
  globalThis.y = view.scale("y");
}

module.exports = {
  loadData,
  renderStaticVisualization,
};
