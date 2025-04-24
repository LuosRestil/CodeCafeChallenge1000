canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");
ctx.lineWidth = 4;

// prevent context menu opening on right click
canvas.oncontextmenu = () => false;

const twoPi = Math.PI * 2;
const radius = 30;
const nodeFontSize = 20;
const edgeFontSize = 15;

const mouse = [0, 0];
let hovered = [];
let dragging = false;
let selected = null;

const logs = await getFileContents("./input.txt");
const { start, dests, connections } = getConnections(logs);
setEventListeners();
requestAnimationFrame(loop);

// *****************
// ***** SETUP *****
// *****************

async function getFileContents(path) {
  const res = await fetch(path);
  return await res.text();
}

function getConnections(logs) {
  const connections = {};
  const lines = logs.split("\n");
  const nodeNames = new Set();
  for (const line of lines.splice(0, lines.length - 3)) {
    const words = line.split(" ");
    const src = words[3];
    const dest = words[5];
    const cap = parseInt(words[8]);
    connections[src] = connections[src] ?? [];
    connections[src].push({ name: dest, cap });
    nodeNames.add(src);
    nodeNames.add(dest);
  }
  const startWords = lines[lines.length - 2].split(" ");
  const destWords = lines[lines.length - 1].split(" ");
  const start = startWords[startWords.length - 1];
  const dests = destWords.slice(6).map((dest) => dest.replace(",", ""));

  [...nodeNames].forEach((nodeName, idx) => {
    const offsetX = radius + idx * radius * 1.5;
    connections[nodeName] = {
      name: nodeName,
      loc: [offsetX, radius],
      dests: connections[nodeName] ?? [],
      showConnections: false,
    };
  });

  return { connections, start, dests };
}

// *************************
// ***** USER CONTROLS *****
// *************************

function setEventListeners() {
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(evt) {
  mouse[0] = evt.offsetX;
  mouse[1] = evt.offsetY;
  hovered = [];
  for (const node of Object.values(connections)) {
    const offset = sub(node.loc, mouse);
    if (mag(offset) < radius) {
      hovered.push({ name: node.name, offset });
    }
  }
  if (dragging) {
    connections[selected.name].loc = add(mouse, selected.offset);
    connections[selected.name].loc = [
      mouse[0] + selected.offset[0],
      mouse[1] + selected.offset[1],
    ];
  }
}

function handleMouseDown(evt) {
  if (evt.button === 0 && hovered.length) {
    selected = hovered[0];
    dragging = true;
    canvas.style.cursor = "grabbing";
  } else if (evt.button === 2 && hovered.length) {
    const connection = connections[hovered[0].name];
    connection.showConnections = !connection.showConnections;
  }
}

function handleMouseUp() {
  dragging = false;
  selected = null;
}

// *********************
// ***** ANIMATION *****
// *********************

function loop() {
  requestAnimationFrame(loop);
  setCursorStyle();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const node of Object.values(connections)) {
    drawNode(node);
    drawArrows(node);
  }
}

// *******************
// ***** DRAWING *****
// *******************

function setCursorStyle() {
  if (dragging) {
    canvas.style.cursor = "grabbing";
  } else {
    canvas.style.cursor = hovered.length ? "grab" : "default";
  }
}

function drawNode(node) {
  if (node.name === start) {
    ctx.strokeStyle = "limegreen";
  } else if (dests.includes(node.name)) {
    ctx.strokeStyle = "red";
  } else {
    ctx.strokeStyle = "black";
  }
  ctx.fillStyle = 'white';

  ctx.beginPath();
  ctx.arc(node.loc[0], node.loc[1], radius, 0, twoPi);
  ctx.fill();
  ctx.stroke();

  const textOffsetX = (node.name.length * nodeFontSize) / 4;
  const textOffsetY = nodeFontSize / 2;
  ctx.font = `${nodeFontSize}px monospace`;
  ctx.fillStyle = "black";
  ctx.fillText(
    node.name,
    node.loc[0] - textOffsetX,
    node.loc[1] + textOffsetY / 2
  );
}

function drawArrows(node) {
  if (!node.showConnections) return;

  for (const dest of node.dests) {
    const destNode = connections[dest.name];
    const nodeToDest = sub(destNode.loc, node.loc);
    const dir = unit(nodeToDest);
    const nodeEdge = add(scale(dir, radius), node.loc);
    const destEdge = add(scale(dir, mag(nodeToDest) - radius * 2), nodeEdge);
    const halfwayMark = add(
      scale(dir, (mag(nodeToDest) - radius * 2) / 2),
      nodeEdge
    );
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(nodeEdge[0], nodeEdge[1]);
    ctx.lineTo(destEdge[0], destEdge[1]);
    ctx.stroke();

    ctx.fillStyle = "limegreen";
    ctx.beginPath();
    ctx.arc(nodeEdge[0], nodeEdge[1], 7, 0, twoPi);
    ctx.fill();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(destEdge[0], destEdge[1], 7, 0, twoPi);
    ctx.fill();

    // draw capacity text
    ctx.fillStyle = "black";
    ctx.font = `${edgeFontSize}px monospace`;
    ctx.fillText(dest.cap, halfwayMark[0] - 50, halfwayMark[1]);
  }
}

// ************************
// ***** VECTOR STUFF *****
// ************************

function sub(vec1, vec2) {
  return [vec1[0] - vec2[0], vec1[1] - vec2[1]];
}

function add(vec1, vec2) {
  return [vec1[0] + vec2[0], vec1[1] + vec2[1]];
}

function mag(vec) {
  return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
}

function dist(vec1, vec2) {
  return mag(sub(vec2, vec1));
}

function scale(vec, scalar) {
  return [vec[0] * scalar, vec[1] * scalar];
}

function unit(vec) {
  return scale(vec, 1 / mag(vec));
}
