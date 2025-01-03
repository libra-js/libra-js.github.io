// global constants
globalThis.MARGIN = { top: 80, right: 20, bottom: 20, left: 80 };
globalThis.WIDTH = 500 - globalThis.MARGIN.left - globalThis.MARGIN.right;
globalThis.HEIGHT = 500 - globalThis.MARGIN.top - globalThis.MARGIN.bottom;

// global variables
globalThis.matrixData = [];
globalThis.names = [
  "Enjolras",
  "Eponine",
  "Fantine",
  "Gavroche",
  "Javert",
  "Marius",
  "Mme. Thenardier",
  "Myriel",
  "Thenardier",
  "Valjean",
];

// shared scales
globalThis.x = null;
globalThis.y = null;
globalThis.color = null;

async function loadData() {
  const miserables = {
    nodes: [
      { nodeName: "Myriel", group: 1 },
      { nodeName: "Napoleon", group: 1 },
      { nodeName: "Mlle. Baptistine", group: 1 },
      { nodeName: "Mme. Magloire", group: 1 },
      { nodeName: "Countess de Lo", group: 1 },
      { nodeName: "Geborand", group: 1 },
      { nodeName: "Champtercier", group: 1 },
      { nodeName: "Cravatte", group: 1 },
      { nodeName: "Count", group: 1 },
      { nodeName: "Old Man", group: 1 },
      { nodeName: "Labarre", group: 2 },
      { nodeName: "Valjean", group: 2 },
      { nodeName: "Marguerite", group: 3 },
      { nodeName: "Mme. de R", group: 2 },
      { nodeName: "Isabeau", group: 2 },
      { nodeName: "Gervais", group: 2 },
      { nodeName: "Tholomyes", group: 3 },
      { nodeName: "Listolier", group: 3 },
      { nodeName: "Fameuil", group: 3 },
      { nodeName: "Blacheville", group: 3 },
      { nodeName: "Favourite", group: 3 },
      { nodeName: "Dahlia", group: 3 },
      { nodeName: "Zephine", group: 3 },
      { nodeName: "Fantine", group: 3 },
      { nodeName: "Mme. Thenardier", group: 4 },
      { nodeName: "Thenardier", group: 4 },
      { nodeName: "Cosette", group: 5 },
      { nodeName: "Javert", group: 4 },
      { nodeName: "Fauchelevent", group: 0 },
      { nodeName: "Bamatabois", group: 2 },
      { nodeName: "Perpetue", group: 3 },
      { nodeName: "Simplice", group: 2 },
      { nodeName: "Scaufflaire", group: 2 },
      { nodeName: "Woman 1", group: 2 },
      { nodeName: "Judge", group: 2 },
      { nodeName: "Champmathieu", group: 2 },
      { nodeName: "Brevet", group: 2 },
      { nodeName: "Chenildieu", group: 2 },
      { nodeName: "Cochepaille", group: 2 },
      { nodeName: "Pontmercy", group: 4 },
      { nodeName: "Boulatruelle", group: 6 },
      { nodeName: "Eponine", group: 4 },
      { nodeName: "Anzelma", group: 4 },
      { nodeName: "Woman 2", group: 5 },
      { nodeName: "Mother Innocent", group: 0 },
      { nodeName: "Gribier", group: 0 },
      { nodeName: "Jondrette", group: 7 },
      { nodeName: "Mme. Burgon", group: 7 },
      { nodeName: "Gavroche", group: 8 },
      { nodeName: "Gillenormand", group: 5 },
      { nodeName: "Magnon", group: 5 },
      { nodeName: "Mlle. Gillenormand", group: 5 },
      { nodeName: "Mme. Pontmercy", group: 5 },
      { nodeName: "Mlle. Vaubois", group: 5 },
      { nodeName: "Lt. Gillenormand", group: 5 },
      { nodeName: "Marius", group: 8 },
      { nodeName: "Baroness T", group: 5 },
      { nodeName: "Mabeuf", group: 8 },
      { nodeName: "Enjolras", group: 8 },
      { nodeName: "Combeferre", group: 8 },
      { nodeName: "Prouvaire", group: 8 },
      { nodeName: "Feuilly", group: 8 },
      { nodeName: "Courfeyrac", group: 8 },
      { nodeName: "Bahorel", group: 8 },
      { nodeName: "Bossuet", group: 8 },
      { nodeName: "Joly", group: 8 },
      { nodeName: "Grantaire", group: 8 },
      { nodeName: "Mother Plutarch", group: 9 },
      { nodeName: "Gueulemer", group: 4 },
      { nodeName: "Babet", group: 4 },
      { nodeName: "Claquesous", group: 4 },
      { nodeName: "Montparnasse", group: 4 },
      { nodeName: "Toussaint", group: 5 },
      { nodeName: "Child 1", group: 10 },
      { nodeName: "Child 2", group: 10 },
      { nodeName: "Brujon", group: 4 },
      { nodeName: "Mme. Hucheloup", group: 8 },
    ],
    links: [
      { source: 1, target: 0, value: 1 },
      { source: 2, target: 0, value: 8 },
      { source: 3, target: 0, value: 10 },
      { source: 3, target: 2, value: 6 },
      { source: 4, target: 0, value: 1 },
      { source: 5, target: 0, value: 1 },
      { source: 6, target: 0, value: 1 },
      { source: 7, target: 0, value: 1 },
      { source: 8, target: 0, value: 2 },
      { source: 9, target: 0, value: 1 },
      { source: 11, target: 10, value: 1 },
      { source: 11, target: 3, value: 3 },
      { source: 11, target: 2, value: 3 },
      { source: 11, target: 0, value: 5 },
      { source: 12, target: 11, value: 1 },
      { source: 13, target: 11, value: 1 },
      { source: 14, target: 11, value: 1 },
      { source: 15, target: 11, value: 1 },
      { source: 17, target: 16, value: 4 },
      { source: 18, target: 16, value: 4 },
      { source: 18, target: 17, value: 4 },
      { source: 19, target: 16, value: 4 },
      { source: 19, target: 17, value: 4 },
      { source: 19, target: 18, value: 4 },
      { source: 20, target: 16, value: 3 },
      { source: 20, target: 17, value: 3 },
      { source: 20, target: 18, value: 3 },
      { source: 20, target: 19, value: 4 },
      { source: 21, target: 16, value: 3 },
      { source: 21, target: 17, value: 3 },
      { source: 21, target: 18, value: 3 },
      { source: 21, target: 19, value: 3 },
      { source: 21, target: 20, value: 5 },
      { source: 22, target: 16, value: 3 },
      { source: 22, target: 17, value: 3 },
      { source: 22, target: 18, value: 3 },
      { source: 22, target: 19, value: 3 },
      { source: 22, target: 20, value: 4 },
      { source: 22, target: 21, value: 4 },
      { source: 23, target: 16, value: 3 },
      { source: 23, target: 17, value: 3 },
      { source: 23, target: 18, value: 3 },
      { source: 23, target: 19, value: 3 },
      { source: 23, target: 20, value: 4 },
      { source: 23, target: 21, value: 4 },
      { source: 23, target: 22, value: 4 },
      { source: 23, target: 12, value: 2 },
      { source: 23, target: 11, value: 9 },
      { source: 24, target: 23, value: 2 },
      { source: 24, target: 11, value: 7 },
      { source: 25, target: 24, value: 13 },
      { source: 25, target: 23, value: 1 },
      { source: 25, target: 11, value: 12 },
      { source: 26, target: 24, value: 4 },
      { source: 26, target: 11, value: 31 },
      { source: 26, target: 16, value: 1 },
      { source: 26, target: 25, value: 1 },
      { source: 27, target: 11, value: 17 },
      { source: 27, target: 23, value: 5 },
      { source: 27, target: 25, value: 5 },
      { source: 27, target: 24, value: 1 },
      { source: 27, target: 26, value: 1 },
      { source: 28, target: 11, value: 8 },
      { source: 28, target: 27, value: 1 },
      { source: 29, target: 23, value: 1 },
      { source: 29, target: 27, value: 1 },
      { source: 29, target: 11, value: 2 },
      { source: 30, target: 23, value: 1 },
      { source: 31, target: 30, value: 2 },
      { source: 31, target: 11, value: 3 },
      { source: 31, target: 23, value: 2 },
      { source: 31, target: 27, value: 1 },
      { source: 32, target: 11, value: 1 },
      { source: 33, target: 11, value: 2 },
      { source: 33, target: 27, value: 1 },
      { source: 34, target: 11, value: 3 },
      { source: 34, target: 29, value: 2 },
      { source: 35, target: 11, value: 3 },
      { source: 35, target: 34, value: 3 },
      { source: 35, target: 29, value: 2 },
      { source: 36, target: 34, value: 2 },
      { source: 36, target: 35, value: 2 },
      { source: 36, target: 11, value: 2 },
      { source: 36, target: 29, value: 1 },
      { source: 37, target: 34, value: 2 },
      { source: 37, target: 35, value: 2 },
      { source: 37, target: 36, value: 2 },
      { source: 37, target: 11, value: 2 },
      { source: 37, target: 29, value: 1 },
      { source: 38, target: 34, value: 2 },
      { source: 38, target: 35, value: 2 },
      { source: 38, target: 36, value: 2 },
      { source: 38, target: 37, value: 2 },
      { source: 38, target: 11, value: 2 },
      { source: 38, target: 29, value: 1 },
      { source: 39, target: 25, value: 1 },
      { source: 40, target: 25, value: 1 },
      { source: 41, target: 24, value: 2 },
      { source: 41, target: 25, value: 3 },
      { source: 42, target: 41, value: 2 },
      { source: 42, target: 25, value: 2 },
      { source: 42, target: 24, value: 1 },
      { source: 43, target: 11, value: 3 },
      { source: 43, target: 26, value: 1 },
      { source: 43, target: 27, value: 1 },
      { source: 44, target: 28, value: 3 },
      { source: 44, target: 11, value: 1 },
      { source: 45, target: 28, value: 2 },
      { source: 47, target: 46, value: 1 },
      { source: 48, target: 47, value: 2 },
      { source: 48, target: 25, value: 1 },
      { source: 48, target: 27, value: 1 },
      { source: 48, target: 11, value: 1 },
      { source: 49, target: 26, value: 3 },
      { source: 49, target: 11, value: 2 },
      { source: 50, target: 49, value: 1 },
      { source: 50, target: 24, value: 1 },
      { source: 51, target: 49, value: 9 },
      { source: 51, target: 26, value: 2 },
      { source: 51, target: 11, value: 2 },
      { source: 52, target: 51, value: 1 },
      { source: 52, target: 39, value: 1 },
      { source: 53, target: 51, value: 1 },
      { source: 54, target: 51, value: 2 },
      { source: 54, target: 49, value: 1 },
      { source: 54, target: 26, value: 1 },
      { source: 55, target: 51, value: 6 },
      { source: 55, target: 49, value: 12 },
      { source: 55, target: 39, value: 1 },
      { source: 55, target: 54, value: 1 },
      { source: 55, target: 26, value: 21 },
      { source: 55, target: 11, value: 19 },
      { source: 55, target: 16, value: 1 },
      { source: 55, target: 25, value: 2 },
      { source: 55, target: 41, value: 5 },
      { source: 55, target: 48, value: 4 },
      { source: 56, target: 49, value: 1 },
      { source: 56, target: 55, value: 1 },
      { source: 57, target: 55, value: 1 },
      { source: 57, target: 41, value: 1 },
      { source: 57, target: 48, value: 1 },
      { source: 58, target: 55, value: 7 },
      { source: 58, target: 48, value: 7 },
      { source: 58, target: 27, value: 6 },
      { source: 58, target: 57, value: 1 },
      { source: 58, target: 11, value: 4 },
      { source: 59, target: 58, value: 15 },
      { source: 59, target: 55, value: 5 },
      { source: 59, target: 48, value: 6 },
      { source: 59, target: 57, value: 2 },
      { source: 60, target: 48, value: 1 },
      { source: 60, target: 58, value: 4 },
      { source: 60, target: 59, value: 2 },
      { source: 61, target: 48, value: 2 },
      { source: 61, target: 58, value: 6 },
      { source: 61, target: 60, value: 2 },
      { source: 61, target: 59, value: 5 },
      { source: 61, target: 57, value: 1 },
      { source: 61, target: 55, value: 1 },
      { source: 62, target: 55, value: 9 },
      { source: 62, target: 58, value: 17 },
      { source: 62, target: 59, value: 13 },
      { source: 62, target: 48, value: 7 },
      { source: 62, target: 57, value: 2 },
      { source: 62, target: 41, value: 1 },
      { source: 62, target: 61, value: 6 },
      { source: 62, target: 60, value: 3 },
      { source: 63, target: 59, value: 5 },
      { source: 63, target: 48, value: 5 },
      { source: 63, target: 62, value: 6 },
      { source: 63, target: 57, value: 2 },
      { source: 63, target: 58, value: 4 },
      { source: 63, target: 61, value: 3 },
      { source: 63, target: 60, value: 2 },
      { source: 63, target: 55, value: 1 },
      { source: 64, target: 55, value: 5 },
      { source: 64, target: 62, value: 12 },
      { source: 64, target: 48, value: 5 },
      { source: 64, target: 63, value: 4 },
      { source: 64, target: 58, value: 10 },
      { source: 64, target: 61, value: 6 },
      { source: 64, target: 60, value: 2 },
      { source: 64, target: 59, value: 9 },
      { source: 64, target: 57, value: 1 },
      { source: 64, target: 11, value: 1 },
      { source: 65, target: 63, value: 5 },
      { source: 65, target: 64, value: 7 },
      { source: 65, target: 48, value: 3 },
      { source: 65, target: 62, value: 5 },
      { source: 65, target: 58, value: 5 },
      { source: 65, target: 61, value: 5 },
      { source: 65, target: 60, value: 2 },
      { source: 65, target: 59, value: 5 },
      { source: 65, target: 57, value: 1 },
      { source: 65, target: 55, value: 2 },
      { source: 66, target: 64, value: 3 },
      { source: 66, target: 58, value: 3 },
      { source: 66, target: 59, value: 1 },
      { source: 66, target: 62, value: 2 },
      { source: 66, target: 65, value: 2 },
      { source: 66, target: 48, value: 1 },
      { source: 66, target: 63, value: 1 },
      { source: 66, target: 61, value: 1 },
      { source: 66, target: 60, value: 1 },
      { source: 67, target: 57, value: 3 },
      { source: 68, target: 25, value: 5 },
      { source: 68, target: 11, value: 1 },
      { source: 68, target: 24, value: 1 },
      { source: 68, target: 27, value: 1 },
      { source: 68, target: 48, value: 1 },
      { source: 68, target: 41, value: 1 },
      { source: 69, target: 25, value: 6 },
      { source: 69, target: 68, value: 6 },
      { source: 69, target: 11, value: 1 },
      { source: 69, target: 24, value: 1 },
      { source: 69, target: 27, value: 2 },
      { source: 69, target: 48, value: 1 },
      { source: 69, target: 41, value: 1 },
      { source: 70, target: 25, value: 4 },
      { source: 70, target: 69, value: 4 },
      { source: 70, target: 68, value: 4 },
      { source: 70, target: 11, value: 1 },
      { source: 70, target: 24, value: 1 },
      { source: 70, target: 27, value: 1 },
      { source: 70, target: 41, value: 1 },
      { source: 70, target: 58, value: 1 },
      { source: 71, target: 27, value: 1 },
      { source: 71, target: 69, value: 2 },
      { source: 71, target: 68, value: 2 },
      { source: 71, target: 70, value: 2 },
      { source: 71, target: 11, value: 1 },
      { source: 71, target: 48, value: 1 },
      { source: 71, target: 41, value: 1 },
      { source: 71, target: 25, value: 1 },
      { source: 72, target: 26, value: 2 },
      { source: 72, target: 27, value: 1 },
      { source: 72, target: 11, value: 1 },
      { source: 73, target: 48, value: 2 },
      { source: 74, target: 48, value: 2 },
      { source: 74, target: 73, value: 3 },
      { source: 75, target: 69, value: 3 },
      { source: 75, target: 68, value: 3 },
      { source: 75, target: 25, value: 3 },
      { source: 75, target: 48, value: 1 },
      { source: 75, target: 41, value: 1 },
      { source: 75, target: 70, value: 1 },
      { source: 75, target: 71, value: 1 },
      { source: 76, target: 64, value: 1 },
      { source: 76, target: 65, value: 1 },
      { source: 76, target: 66, value: 1 },
      { source: 76, target: 63, value: 1 },
      { source: 76, target: 62, value: 1 },
      { source: 76, target: 48, value: 1 },
      { source: 76, target: 58, value: 1 },
    ],
  };

  const nodeIndices = {};
  miserables.nodes.forEach((node, index) => {
    if (globalThis.names.includes(node.nodeName)) {
      nodeIndices[node.nodeName] = index;
    }
  });

  const linkData = miserables.links.filter(
    (link) =>
      globalThis.names.includes(miserables.nodes[link.source].nodeName) &&
      globalThis.names.includes(miserables.nodes[link.target].nodeName)
  );

  const matrix = Array(globalThis.names.length)
    .fill()
    .map(() => Array(globalThis.names.length).fill(0));

  linkData.forEach((link) => {
    const sourceName = miserables.nodes[link.source].nodeName;
    const targetName = miserables.nodes[link.target].nodeName;
    const sourceIndex = globalThis.names.indexOf(sourceName);
    const targetIndex = globalThis.names.indexOf(targetName);
    matrix[sourceIndex][targetIndex] = link.value;
    matrix[targetIndex][sourceIndex] = link.value; // Make the matrix symmetric
  });

  globalThis.matrixData = globalThis.names.flatMap((rowName, i) =>
    globalThis.names.map((colName, j) => ({
      row: rowName,
      col: colName,
      value: i == j ? 1 : matrix[i][j] / 3, // Normalize values
    }))
  );
}

function renderStaticVisualization() {
  // append the svg object to the body of the page
  const svg = d3
    .select("#LibraPlayground")
    .append("svg")
    .attr(
      "width",
      globalThis.WIDTH + globalThis.MARGIN.left + globalThis.MARGIN.right
    )
    .attr(
      "height",
      globalThis.HEIGHT + globalThis.MARGIN.top + globalThis.MARGIN.bottom
    )
    .append("g")
    .attr(
      "transform",
      `translate(${globalThis.MARGIN.left},${globalThis.MARGIN.top})`
    );

  // Create scales
  globalThis.x = d3
    .scaleBand()
    .domain(globalThis.names)
    .range([0, globalThis.WIDTH])
    .padding(0.01);

  globalThis.y = d3
    .scaleBand()
    .domain(globalThis.names)
    .range([0, globalThis.HEIGHT])
    .padding(0.01);

  globalThis.color = d3
    .scaleLinear()
    .domain([0, 1])
    .range(["white", "steelblue"])
    .clamp(true);
}

module.exports = {
  loadData,
  renderStaticVisualization,
};
