const canvas = document.getElementById("cnvs");

const gameState = {};

const GRID = 20;
const RADIUS_OF_TRIANGLE = 5;
const RADIUS_OF_CIRCLE = 5;
const RADIUS_OF_HEXAGON = 5;
const COUNT_OF_TRIANGLES = 600;
const COUNT_OF_CIRCLES = 0;
const COUNT_OF_HEXAGONS = 600;
const HEXAGON = "hexagon";
const CIRCLE = "circle";
const TRIANGLE = "triangle";

function queueUpdates(numTicks) {
  for (let i = 0; i < numTicks; i++) {
    gameState.lastTick = gameState.lastTick + gameState.tickLength;
    update(gameState.lastTick);
  }
}

function draw(tFrame) {
  const context = canvas.getContext("2d");

  //clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawPolygons(context);
}

function update(tick) {
  const elems = gameState.elems;
  for (let i = 0; i < elems.length; i++) {
    for (let j = i + 1; j < elems.length; j++) {
      if (
        checkRoughCollision(elems[i], elems[j]) &&
        checkCollisionPrecisely(elems[i], elems[j])
      ) {
        [elems[i].vx, elems[j].vx] = [elems[j].vx, elems[i].vx];
        [elems[i].vy, elems[j].vy] = [elems[j].vy, elems[i].vy];
        crash(elems[i]);
        crash(elems[j]);
      }
    }
  }

  elems.forEach(function(elem) {
    elem.x += elem.vx;
    elem.y += elem.vy;
    checkWalls(elem);
  });

  gameState.elems = gameState.elems.filter(e => e.lives > 0);
}

function run(tFrame) {
  gameState.stopCycle = window.requestAnimationFrame(run);

  const nextTick = gameState.lastTick + gameState.tickLength;
  let numTicks = 0;

  if (tFrame > nextTick) {
    const timeSinceTick = tFrame - gameState.lastTick;
    numTicks = Math.floor(timeSinceTick / gameState.tickLength);
  }
  queueUpdates(numTicks);
  draw(tFrame);
  gameState.lastRender = tFrame;
}

function stopGame(handle) {
  window.cancelAnimationFrame(handle);
}

function drawCircle(context, element) {
  const { x, y, radius, color } = element;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
  context.closePath();
}

function drawPolygons(context) {
  gameState.elems.forEach(element => {
    switch (element.type) {
      case HEXAGON:
        drawPolygon(context, element);
        break;
      case TRIANGLE:
        drawPolygon(context, element);
        break;
      case CIRCLE:
        drawCircle(context, element);
        break;
      default:
        break;
    }
  });
}

function drawPolygon(context, item) {
  //расчитать точки заранее, потом просто смещать
  const { x, y, color, points } = item;
  context.beginPath();
  context.moveTo(x + points[0][0], y + points[0][1]);
  for (var i = 1; i < points.length; i++) {
    context.lineTo(x + points[i][0], y + points[i][1]);
  }
  context.fillStyle = color;
  context.fill();
  context.closePath();
}

function setup() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gridIndices = [];
  for (var i = 1; i < canvas.width / GRID - 1; i++) {
    for (var j = 1; j < canvas.height / GRID - 1; j++) {
      gridIndices.push([i, j]);
    }
  }

  shuffle(gridIndices);

  gameState.lastTick = performance.now();
  gameState.lastRender = gameState.lastTick;
  gameState.tickLength = 15; //ms
  gameState.gridIndices = gridIndices;
  gameState.elems = [];

  generateShapes(HEXAGON, COUNT_OF_HEXAGONS, 0, RADIUS_OF_HEXAGON);
  generateShapes(
    TRIANGLE,
    COUNT_OF_TRIANGLES,
    COUNT_OF_HEXAGONS + 1,
    RADIUS_OF_TRIANGLE
  );
  generateShapes(
    CIRCLE,
    COUNT_OF_CIRCLES,
    COUNT_OF_HEXAGONS + COUNT_OF_TRIANGLES + 2,
    RADIUS_OF_CIRCLE
  );
}

function generateShapes(typeShape, count, shift, radius) {
  const gridIndices = gameState.gridIndices;
  for (var i = shift; i < count + shift; i++) {
    const angle = (2 * Math.PI) / getRandomInt(1, 10);
    gameState.elems.push({
      x: gridIndices[i][0] * GRID,
      y: gridIndices[i][1] * GRID,
      radius: radius,
      angle: angle,
      type: typeShape,
      vx: getRandomInt(-4, 4),
      vy: getRandomInt(-4, 4),
      color: "#808080",
      lives: 3,
      points: getPointsByType(radius, angle, typeShape)
    });
  }
  console.log(gameState.elems);
}

function getPointsByType(radius, angle, typeShape) {
  switch (typeShape) {
    case HEXAGON:
      return getPoints(radius, angle, 6);
    case TRIANGLE:
      return getPoints(radius, angle, 3);
    default:
      return [];
  }
}

function getPoints(radius, angle, cnt) {
  const points = [[radius * Math.cos(angle), radius * Math.sin(angle)]];
  for (var i = 1; i < cnt + 1; i++) {
    let newAngle = angle + (i * 2 * Math.PI) / cnt;
    points.push([radius * Math.cos(newAngle), radius * Math.sin(newAngle)]);
  }
  return points;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.random() * (max - min) + min; //Максимум не включается, минимум включается
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function checkWalls(elem) {
  if (elem.x - elem.radius < 0 || elem.x + elem.radius > canvas.width) {
    elem.vx *= -1;
  }
  if (elem.y - elem.radius < 0 || elem.y + elem.radius > canvas.height) {
    elem.vy *= -1;
  }
}

function checkRoughCollision(lhd, rhd) {
  var dx = lhd.x - rhd.x;
  var dy = lhd.y - rhd.y;
  var distance = Math.sqrt(dx * dx + dy * dy);
  return distance < lhd.radius + rhd.radius;
}

function checkCollisionPrecisely(lhd, rhd) {
  for (let i = 0; i < lhd.points.length - 1; i++) {
    for (let j = 0; j < rhd.points.length - 1; j++) {
      if (
        isEdgesIntersect(
          lhd.points[i][0] + lhd.x,
          lhd.points[i][1] + lhd.y,
          lhd.points[i + 1][0] + lhd.x,
          lhd.points[i + 1][1] + lhd.y,
          rhd.points[j][0] + rhd.x,
          rhd.points[j][1] + rhd.y,
          rhd.points[j + 1][0] + rhd.x,
          rhd.points[j + 1][1] + rhd.y
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function isEdgesIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const r =
    ((ay - cy) * (dx - cx) - (ax - cx) * (dy - cy)) /
    ((bx - ax) * (dy - cy) - (by - ay) * (dx - cx));
  const s =
    ((ay - cy) * (bx - ax) - (ax - cx) * (by - ay)) /
    ((bx - ax) * (dy - cy) - (by - ay) * (dx - cx));
  return r >= 0 && r <= 1 && s >= 0 && s <= 1;
}

function crash(elem) {
  elem.lives--;
  switch (elem.lives) {
    case 2:
      elem.color = "#F8F32B";
      break;
    case 1:
      elem.color = "#991400";
      break;
    default:
      break;
  }
}

setup();
run();
