console.log("WOOT");

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480

const PLAYER_WIDTH = 10
const PLAYER_HEIGHT = 10

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let x = Math.floor(CANVAS_WIDTH / 2)
let y = Math.floor(CANVAS_HEIGHT / 2)

function updateCanvasSize() {
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

function init() {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
}

function update() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = "white"
  ctx.fillRect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT)
  requestAnimationFrame(update)
}

function onMouseMove(event) {
  x = Math.floor(event.x / canvas.clientWidth * CANVAS_WIDTH - PLAYER_WIDTH / 2)
  y = Math.floor(event.y / canvas.clientHeight * CANVAS_HEIGHT - PLAYER_HEIGHT / 2)
}

// For some reason scrollbars will randomly appear on page load unless you init
// in an onload event listener.
window.addEventListener('load', init)
window.addEventListener('mousemove', onMouseMove)
requestAnimationFrame(update)