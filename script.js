// const CANVAS_WIDTH = 640
// const CANVAS_HEIGHT = 480

let screenWidth = 100
let screenHeight

const PLAYER_WIDTH = 10
const PLAYER_HEIGHT = 10
const PLAYER_MAX_HEALTH = 5

const ENEMY_WIDTH = 10
const ENEMY_HEIGHT = 10
const ENEMY_SPEED = 1/100
const ENEMY_FIRE_RATE = 2/3

const BULLET_WIDTH = 2
const BULLET_HEIGHT = 2
const BULLET_SPEED = 2/100

const HEART_WIDTH = 2
const HEART_HEIGHT = 2
const HEART_COLOR = "crimson"
const HEART_SPEED = 1/100

const COIN_WIDTH = 2
const COIN_HEIGHT = 2
const COIN_COLOR = "gold"
const COIN_SPEED = 1/100

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
  shootTimer;

  constructor(x, y, health, shootTimer) {
    this.x = x;
    this.y = y;
    this.health = health;
    this.shootTimer = shootTimer;
  }
}

class Heart {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Coin {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
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
let playerHealth = PLAYER_MAX_HEALTH
let playerCoins = 0

let enemies = []
let hearts = []
let coins = []
let playerBullets = []
let enemyBullets = []

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
  canvas.addEventListener('mousemove', onMouseMove)
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

  for (let bullet of enemyBullets) {
    bullet.y += BULLET_SPEED * deltaTime
  }

  for (let enemy of enemies) {
    enemy.y += ENEMY_SPEED * deltaTime
  }

  for (let heart of hearts) {
    heart.y += HEART_SPEED * deltaTime
  }
  for (let coin of coins) {
    coin.y += COIN_SPEED * deltaTime
  }

  let deletedHeartIndices = new Set()
  for (let [heartIndex, heart] of hearts.entries()) {
    if (checkCollision(heart.x, HEART_WIDTH, x, PLAYER_WIDTH, heart.y, HEART_HEIGHT, y, PLAYER_HEIGHT)) {
      if (playerHealth < PLAYER_MAX_HEALTH) {
        playerHealth += 1
        deletedHeartIndices.add(heartIndex)
      }
    }
  }

  let deletedCoinIndices = new Set()
  for (let [coinIndex, coin] of coins.entries()) {
    if (checkCollision(coin.x, COIN_WIDTH, x, PLAYER_WIDTH, coin.y, COIN_HEIGHT, y, PLAYER_HEIGHT)) {
      playerCoins += 1
      deletedCoinIndices.add(coinIndex)
    }
  }

  let deletedEnemyIndices = new Set()
  let deletedPlayerBulletIndices = new Set()
  for (let [enemyIndex, enemy] of enemies.entries()) {
    for (let [bulletIndex, bullet] of playerBullets.entries()) {
      
      if (checkCollision(bullet.x, BULLET_WIDTH, enemy.x, ENEMY_WIDTH, bullet.y, BULLET_HEIGHT, enemy.y, ENEMY_HEIGHT)) {
        deletedPlayerBulletIndices.add(bulletIndex)
        if (!deletedEnemyIndices.has(enemyIndex)) {
          enemy.health -= 1
          if (enemy.health <= 0) {
            deletedEnemyIndices.add(enemyIndex)
            if (Math.random() < 0.25) {
              hearts.push(new Heart(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2))
            } else if (Math.random() < 0.5) {
              coins.push(new Coin(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2))
            }
          }
        }
      }
    }
  }

  let deletedEnemyBulletIndices = new Set()
  for (let [bulletIndex, bullet] of enemyBullets.entries()) {
    if (checkCollision(bullet.x, BULLET_WIDTH, x, PLAYER_WIDTH, bullet.y, BULLET_HEIGHT, y, PLAYER_HEIGHT)) {
      deletedEnemyBulletIndices.add(bulletIndex)
      playerHealth = Math.max(0, playerHealth - 1)
    }
  }

  for (let [bulletIndex, bullet] of playerBullets.entries()) {
    if (bullet.y + BULLET_HEIGHT < 0) {
      deletedPlayerBulletIndices.add(bulletIndex)
    }
  }

  for (let [bulletIndex, bullet] of enemyBullets.entries()) {
    if (bullet.y > screenHeight) {
      deletedEnemyBulletIndices.add(bulletIndex)
    }
  }

  for (let [enemyIndex, enemy] of enemies.entries()) {
    if (enemy.y > screenHeight) {
      deletedEnemyIndices.add(enemyIndex)
    }
  }

  for (let [heartIndex, heart] of hearts.entries()) {
    if (heart.y > screenHeight) {
      deletedHeartIndices.add(heartIndex)
    }
  }

  for (let [coinIndex, coin] of coins.entries()) {
    if (coin.y > screenHeight) {
      deletedCoinIndices.add(coinIndex)
    }
  }

  for (let bulletIndex of deletedPlayerBulletIndices.keys()) {
    playerBullets.splice(bulletIndex, 1)
  }
  for (let bulletIndex of deletedEnemyBulletIndices.keys()) {
    enemyBullets.splice(bulletIndex, 1)
  }
  for (let enemyIndex of deletedEnemyIndices.keys()) {
    enemies.splice(enemyIndex, 1)
  }
  for (let heartIndex of deletedHeartIndices.keys()) {
    hearts.splice(heartIndex, 1)
  }
  for (let coinIndex of deletedCoinIndices.keys()) {
    coins.splice(coinIndex, 1)
  }

  if (playerHealth > 0) {
    playerShootTimer.update(deltaTime, () => playerShoot(x, y))
  }
  for (let enemy of enemies) {
    enemy.shootTimer.update(deltaTime, () => enemyShoot(enemy.x, enemy.y))
  }
  if (playerHealth > 0) {
    spawnEnemyTimer.update(deltaTime, spawnEnemy)
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let heart of hearts) {
    ctx.fillStyle = HEART_COLOR
    ctx.fillRect(canvasUnits(heart.x), canvasUnits(heart.y), canvasUnits(HEART_WIDTH), canvasUnits(HEART_HEIGHT))
  }

  for (let coin of coins) {
    ctx.fillStyle = COIN_COLOR
    ctx.fillRect(canvasUnits(coin.x), canvasUnits(coin.y), canvasUnits(COIN_WIDTH), canvasUnits(COIN_HEIGHT))
  }

  for (let bullet of playerBullets) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(bullet.x), canvasUnits(bullet.y), canvasUnits(BULLET_WIDTH), canvasUnits(BULLET_HEIGHT))
  }

  for (let bullet of enemyBullets) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(bullet.x), canvasUnits(bullet.y), canvasUnits(BULLET_WIDTH), canvasUnits(BULLET_HEIGHT))
  }

  for (let enemy of enemies) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(enemy.x), canvasUnits(enemy.y), canvasUnits(ENEMY_WIDTH), canvasUnits(ENEMY_HEIGHT))
  }

  if (playerHealth > 0) {
    ctx.fillStyle = "white"
    ctx.fillRect(canvasUnits(x), canvasUnits(y), canvasUnits(PLAYER_WIDTH), canvasUnits(PLAYER_HEIGHT))
  }

  ctx.fillText("Health: " + playerHealth, 2, 10)
  ctx.fillText("Coins: " + playerCoins, 2, 20)
  
  prevTime = time
  requestAnimationFrame(update)
}

function onMouseMove(event) {
  x = event.offsetX / canvas.clientWidth * screenWidth - PLAYER_WIDTH / 2
  y = event.offsetY / canvas.clientHeight * screenHeight - PLAYER_HEIGHT / 2
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

function copyTouch({ identifier, clientX, clientY }) {
  return { identifier, clientX, clientY };
}

function spawnEnemy() {
  if (Math.random() < 0.5) {
    enemies.push(new Enemy(Math.random() * (screenWidth - ENEMY_WIDTH), -ENEMY_HEIGHT, 3, new Timer(1000 / ENEMY_FIRE_RATE)))
  }
}

function playerShoot(playerX, playerY) {
  playerBullets.push(new Bullet(
    playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
    playerY - BULLET_HEIGHT
  ))
}

function enemyShoot(enemyX, enemyY) {
  enemyBullets.push(new Bullet(
    enemyX + ENEMY_WIDTH / 2 - BULLET_WIDTH / 2,
    enemyY + ENEMY_HEIGHT
  ))
}

function checkCollision(x1, w1, x2, w2, y1, h1, y2, h2) {
  return (
    (
      (x1 > x2 && x1 < x2 + w2) ||
      (x1 + w1 > x2 && x1 + w1 < x2 + w2)
    ) &&
    (
      (y1 > y2 && y1 < y2 + h2) ||
      (y1 + h1 > y2 && y1 + h1 < y2 + h2)
    )
  )
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