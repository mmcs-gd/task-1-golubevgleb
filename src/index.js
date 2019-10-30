const canvas = document.getElementById("cnvs");

const gameState = {};

const SEC_IN_MILLIS = 1000;

function onMouseMove(e) {
  gameState.pointer.x = e.pageX;
  gameState.pointer.y = e.pageY;
}

function queueUpdates(numTicks) {
  for (let i = 0; i < numTicks; i++) {
    gameState.lastTick = gameState.lastTick + gameState.tickLength;
    update(gameState.lastTick);
  }
}

function draw(tFrame) {
  const context = canvas.getContext("2d");

  // clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawPlatform(context);
  drawBall(context);
  drawScore(context);
  drawBonus(context);
}

function update(tick) {
  const vx = (gameState.pointer.x - gameState.player.x) / 10;
  gameState.player.x += vx;

  const ball = gameState.ball;
  ball.y += ball.vy;
  ball.y += ball.vx;

  const score = gameState.score;

  if (gameState.lastTick - score.lastSave >= SEC_IN_MILLIS) {
    score.value += 1;
    score.lastSave = gameState.lastTick;
  }

  if (gameState.lastTick - ball.lastTick >= 30 * SEC_IN_MILLIS) {
    ball.vx *= 1.1;
    ball.vy *= 1.1;
    ball.lastTick = gameState.lastTick;
  }

  const bonus = gameState.bonus;

  if (
    gameState.lastTick - bonus.lastInstance > 15 * SEC_IN_MILLIS &&
    !bonus.isCreated
  ) {
    createBonus();
  }

  moveBonus();

  checkFloor(ball, function() {
    stopGame(gameState.stopCycle);
  });
  checkFloor(bonus, function() {
    bonus.isCreated = false;
  });
  checkPlatformCollision(ball, function() {
    ball.vy *= -1;
  });
  checkPlatformCollision(bonus, function() {
    if (bonus.isCreated === true) {
      bonus.isCreated = false;
      score.value += 15;
    }
  });
  checkWallCollision(ball);
  checkWallCollision(bonus);
  checkCellingCollision(ball);
  checkCellingCollision(bonus);
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

function drawPlatform(context) {
  const { x, y, width, height } = gameState.player;
  context.beginPath();
  context.rect(x - width / 2, y - height / 2, width, height);
  context.fillStyle = "#FF0000";
  context.fill();
  context.closePath();
}

function drawBall(context) {
  const { x, y, radius } = gameState.ball;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = "#0000FF";
  context.fill();
  context.closePath();
}

function drawScore(context) {
  const { x, y, width, height, value } = gameState.score;
  context.beginPath();
  context.rect(x, y, width, height);
  context.fillStyle = "#CD0074";
  context.fill();
  context.fillStyle = "#FFFFFF";
  context.textAlign = "center";
  context.font = "18px serif";
  context.fillText("score: " + value, x + width / 2, y + height / 2 + 5);
  context.closePath();
}

function drawBonus(context) {
  if (gameState.bonus.isCreated) {
    const { x, y, radius, width } = gameState.bonus;
    context.beginPath();
    context.rect(x - radius, y - width / 2, 2 * radius, width);
    context.rect(x - width / 2, y - radius, width, 2 * radius);
    context.fillStyle = "#FFD700";
    context.fill();
    context.closePath();
  }
}

function setup() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  canvas.addEventListener("mousemove", onMouseMove, false);

  gameState.lastTick = performance.now();
  gameState.lastRender = gameState.lastTick;
  gameState.tickLength = 15; //ms

  const platform = {
    width: 400,
    height: 50
  };

  gameState.player = {
    x: 100,
    y: canvas.height - platform.height / 2,
    width: platform.width,
    height: platform.height
  };
  gameState.pointer = {
    x: 0,
    y: 0
  };
  gameState.ball = {
    x: canvas.width / 2,
    y: 0,
    radius: 25,
    vx: 0,
    vy: 5,
    lastTick: 0
  };
  gameState.score = {
    x: 5,
    y: 5,
    width: 100,
    height: 36,
    value: 0,
    lastSave: 0
  };
  gameState.bonus = {
    x: 100,
    y: 100,
    radius: 50,
    width: 50,
    vx: 0,
    vy: 0,
    lastInstance: 0,
    isCreated: false
  };
}

function checkFloor(item, handler) {
  if (item.y >= canvas.height + item.radius) {
    handler();
  }
}

function checkWallCollision(item) {
  if (item.x + item.radius >= canvas.width || item.x + item.radius <= 0) {
    item.vx *= -1;
  }
}

function checkCellingCollision(item) {
  if (item.y + item.radius < 0) {
    item.vy *= -1;
  }
}

function checkPlatformCollision(item, handler) {
  const player = gameState.player;
  if (
    item.y + item.radius >= canvas.height - player.height &&
    item.x + item.radius >= player.x - player.width / 2 &&
    item.x + item.radius <= player.x + player.width / 2 &&
    item.y < player.y - player.height / 2
  ) {
    handler();
  }
}

function bounceOff() {
  gameState.ball.vx *= -1;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

function createBonus() {
  const bonus = gameState.bonus;
  bonus.radius = getRandomInt(10, 20);
  bonus.x = getRandomInt(0 + bonus.radius, canvas.width - bonus.radius);
  bonus.y = getRandomInt(0 + bonus.radius, canvas.height / 2);
  bonus.vx = getRandomInt(-10, 10);
  bonus.vy = getRandomInt(1, 5);
  bonus.width = getRandomInt(5, 10);
  bonus.isCreated = true;
  bonus.lastInstance = gameState.lastTick;
}

function moveBonus() {
  const bonus = gameState.bonus;
  bonus.x += bonus.vx;
  bonus.y += bonus.vy;
}

setup();
run();
