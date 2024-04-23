const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480

let screenWidth = 100
let screenHeight

const PLAYER_WIDTH = 10
const PLAYER_HEIGHT = 10

const ENEMY_WIDTH = 10
const ENEMY_HEIGHT = 10
const ENEMY_SPEED = 1/100

const BULLET_WIDTH = 5
const BULLET_HEIGHT = 5
const BULLET_SPEED = 2/100

class Timer {
  duration;
  current;

  constructor(duration) {
    this.duration = duration;
    this.current = 0;
  }

  update(deltaTime, onTick) {
    this.current += deltaTime;
    let tickCount = Math.floor(this.current / this.duration);
    // The loop causes many to spawn all at once after minimize + maximize.
    // for (let i = 0; i < tickCount; i++) {
    //   onTick();
    // }
    if (tickCount > 0) {
      onTick();
    }
    this.current -= this.duration * tickCount;
  }
}

class Enemy {
  x;
  y;
  health;

  constructor(x, y, health) {
    this.x = x;
    this.y = y;
    this.health = health;
  }
}

class Bullet {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let x
let y

let enemies = []
let playerBullets = []

let spawnEnemyTimer = new Timer(2000)
let playerShootTimer = new Timer(600)

function updateCanvasDimensions() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  screenHeight = canvas.height / canvas.width * screenWidth
  // canvas.style.width = window.innerWidth + 'px'
  // canvas.style.height = window.innerHeight + 'px'
}

function init() {
  // canvas.width = CANVAS_WIDTH
  // canvas.height = CANVAS_HEIGHT
  updateCanvasDimensions()
  window.addEventListener('resize', updateCanvasDimensions)
  window.addEventListener('mousemove', onMouseMove)
  // Need passive: false for some Chrome-specific thing?
  // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
  window.addEventListener('touchstart', onTouchStart, {passive: false})
  window.addEventListener('touchmove', onTouchMove, {passive: false})
  window.addEventListener('touchend', onTouchEnd, {passive: false})
  window.addEventListener('touchcancel', onTouchEnd, {passive: false})

  x = screenWidth / 2 - PLAYER_WIDTH / 2
  y = screenHeight / 2 - PLAYER_HEIGHT / 2

  requestAnimationFrame(update)
}

let prevTime = 0

function update(time) {
  let deltaTime = 0
  if (prevTime != 0) {
    deltaTime = time - prevTime
  }

  for (let bullet of playerBullets) {
    bullet.y -= BULLET_SPEED * deltaTime
  }

  for (let enemy of enemies) {
    enemy.y += ENEMY_SPEED * deltaTime
  }

  let deletedEnemyIndices = new Set()
  let deletedBulletIndices = new Set()
  for (let [enemyIndex, enemy] of enemies.entries()) {
    for (let [bulletIndex, bullet] of playerBullets.entries()) {
      if (
        (
          (bullet.x > enemy.x && bullet.x < enemy.x + ENEMY_WIDTH) ||
          (bullet.x + BULLET_WIDTH > enemy.x && bullet.x + BULLET_WIDTH < enemy.x + ENEMY_WIDTH)
        ) &&
        (
          (bullet.y > enemy.y && bullet.y < enemy.y + ENEMY_HEIGHT) ||
          (bullet.y + BULLET_HEIGHT > enemy.y && bullet.y + BULLET_HEIGHT < enemy.y + ENEMY_HEIGHT)
        )
      ) {
        deletedBulletIndices.add(bulletIndex)
        if (!deletedEnemyIndices.has(enemyIndex)) {
          enemy.health -= 1
          if (enemy.health <= 0) {
            deletedEnemyIndices.add(enemyIndex)
          }
        }
      }
    }
  }
  for (let bulletIndex of deletedBulletIndices.keys()) {
    playerBullets.splice(bulletIndex, 1)
  }
  for (let enemyIndex of deletedEnemyIndices.keys()) {
    enemies.splice(enemyIndex, 1)
  }

  playerShootTimer.update(deltaTime, () => playerShoot(x, y))
  spawnEnemyTimer.update(deltaTime, spawnEnemy)

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let bullet of playerBullets) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(bullet.x), canvasUnits(bullet.y), canvasUnits(BULLET_WIDTH), canvasUnits(BULLET_HEIGHT))
  }

  for (let enemy of enemies) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(enemy.x), canvasUnits(enemy.y), canvasUnits(ENEMY_WIDTH), canvasUnits(ENEMY_HEIGHT))
  }

  ctx.fillStyle = "white"
  ctx.fillRect(canvasUnits(x), canvasUnits(y), canvasUnits(PLAYER_WIDTH), canvasUnits(PLAYER_HEIGHT))
  
  prevTime = time
  requestAnimationFrame(update)
}

function onMouseMove(event) {
  x = event.x / canvas.clientWidth * screenWidth - PLAYER_WIDTH / 2
  y = event.y / canvas.clientHeight * screenHeight - PLAYER_HEIGHT / 2
}

const ongoingTouches = [];

function onTouchStart(event) {
  event.preventDefault();
  const touches = event.changedTouches
  for (let i = 0; i < touches.length; i++) {
    ongoingTouches.push(copyTouch(touches[i]))
  }
}

function onTouchMove(event) {
  event.preventDefault();
  const touches = event.changedTouches
  for (let i = 0; i < touches.length; i++) {
    let touch = touches[i]
    const ongoingTouchIndex = ongoingTouches.findIndex(ongoingTouch => ongoingTouch.identifier === touch.identifier)
    if (ongoingTouchIndex !== -1) {
      const ongoingTouch = ongoingTouches[ongoingTouchIndex]
      x += (touch.clientX - ongoingTouch.clientX) / canvas.clientWidth * screenWidth
      y += (touch.clientY - ongoingTouch.clientY) / canvas.clientHeight * screenHeight
      ongoingTouches.splice(ongoingTouchIndex, 1, copyTouch(touch))
    }
  }
}

function onTouchEnd(event) {
  event.preventDefault()
  const touches = event.changedTouches
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i]
    const ongoingTouchResult = findOngoingTouch(touch.identifier)
    if (ongoingTouchResult == null) {
      continue;
    }
    const [ongoingTouchIndex, ongoingTouch] = ongoingTouchResult
    ongoingTouches.splice(ongoingTouchIndex, 1)
  }
}

function findOngoingTouch(identifier) {
  for (let [i, touch] of ongoingTouches.entries()) {
    if (touch.identifier === identifier) {
      return [i, touch]
    }
  }
  return null
}

function copyTouch({ identifier, pageX, pageY }) {
  return { identifier, pageX, pageY };
}

function spawnEnemy() {
  if (Math.random() < 0.5) {
    enemies.push(new Enemy(Math.random() * (screenWidth - ENEMY_WIDTH), -ENEMY_HEIGHT, 3))
  }
}

function playerShoot(playerX, playerY) {
  playerBullets.push(new Bullet(
    playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
    playerY - BULLET_HEIGHT
  ))
}

function canvasUnits(worldUnits) {
  return Math.floor(worldUnits * canvas.width / screenWidth)
}

function worldUnits(canvasUnits) {
  return canvasUnits * screenWidth / canvas.width
}

// For some reason scrollbars will randomly appear on page load unless you init
// in an onload event listener.
window.addEventListener('load', init)