import * as PIXI from 'pixi.js'
import { coulombForce } from './physics'
import useSimulationStore from '@/store/simulationStore'

const DAMPING = 0.85        // friction supaya charge ga mental terus
const MASS = 1e-6           // massa virtual (bisa dituning)
const TIME_STEP = 1 / 60   // 60fps fixed step

export function createPixiApp(canvasElement) {
  const app = new PIXI.Application()

  app.init({
    canvas: canvasElement,
    resizeTo: canvasElement.parentElement,
    backgroundColor: 0x0f172a,
    antialias: true,
  })

  return app
}

// Sprites dikelola di luar React — Map<id, PIXI.Graphics>
const spriteMap = new Map()

export function syncSpritesToStore(app) {
  const store = useSimulationStore.getState()
  const { charges } = store

  charges.forEach((charge) => {
    if (!spriteMap.has(charge.id)) {
      const g = createChargeSprite(charge)
      app.stage.addChild(g)
      spriteMap.set(charge.id, g)
    }

    const sprite = spriteMap.get(charge.id)
    sprite.x = charge.x
    sprite.y = charge.y
  })

  // Hapus sprite yang sudah tidak ada di store
  spriteMap.forEach((sprite, id) => {
    if (!charges.find((c) => c.id === id)) {
      app.stage.removeChild(sprite)
      sprite.destroy()
      spriteMap.delete(id)
    }
  })
}

function createChargeSprite(charge) {
  const g = new PIXI.Graphics()
  const isPositive = charge.value >= 0
  const color = isPositive ? 0xe74c3c : 0x3498db

  g.circle(0, 0, 24)
  g.fill({ color })
  g.x = charge.x
  g.y = charge.y
  g.eventMode = 'static'
  g.cursor = 'pointer'

  // Drag support
  g.on('pointerdown', onDragStart)
  g.on('pointerup', onDragEnd)
  g.on('pointerupoutside', onDragEnd)
  g.on('pointermove', onDragMove)

  g._chargeId = charge.id

  return g
}

let dragTarget = null

function onDragStart(e) {
  dragTarget = e.currentTarget
  dragTarget.alpha = 0.7
  useSimulationStore.getState().recordInteraction()
}

function onDragEnd() {
  if (dragTarget) {
    dragTarget.alpha = 1
    dragTarget = null
  }
}

function onDragMove(e) {
  if (!dragTarget) return
  const pos = e.data.global
  dragTarget.x = pos.x
  dragTarget.y = pos.y
  useSimulationStore
    .getState()
    .updateChargePosition(dragTarget._chargeId, pos.x, pos.y)
}

// Physics ticker — dipanggil tiap frame
export function physicsStep(app) {
  const store = useSimulationStore.getState()
  const { charges } = store

  if (charges.length < 2) return

  const [q1, q2] = charges
  const { fx, fy, magnitude } = coulombForce(q1, q2)

  // Update velocity (F = ma, a = F/m)
  q1.vx += (fx / MASS) * TIME_STEP
  q1.vy += (fy / MASS) * TIME_STEP
  q2.vx -= (fx / MASS) * TIME_STEP
  q2.vy -= (fy / MASS) * TIME_STEP

  // Damping
  q1.vx *= DAMPING
  q1.vy *= DAMPING
  q2.vx *= DAMPING
  q2.vy *= DAMPING

  // Update posisi
  q1.x += q1.vx
  q1.y += q1.vy
  q2.x += q2.vx
  q2.y += q2.vy

  store.setCharges([{ ...q1 }, { ...q2 }])
  store.setForceVector({ magnitude, unit: 'N' })

  syncSpritesToStore(app)
}
