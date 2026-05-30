import { useEffect, useRef } from 'react'
import { createPixiApp, physicsStep, syncSpritesToStore } from '@/pixi/pixiManager'
import useSimulationStore from '@/store/simulationStore'

const INITIAL_CHARGES = [
  { id: 'q1', x: 300, y: 300, value: 1e-6, vx: 0, vy: 0 },
  { id: 'q2', x: 500, y: 300, value: -1e-6, vx: 0, vy: 0 },
]

export default function SimulationCanvas() {
  const canvasRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    let app

    async function init() {
      app = createPixiApp(canvasRef.current)
      appRef.current = app

      // Inisialisasi charges di store
      useSimulationStore.getState().setCharges(INITIAL_CHARGES)

      await app.init

      // Render sprites awal
      syncSpritesToStore(app)

      // Physics ticker loop
      app.ticker.add(() => physicsStep(app))
    }

    init()

    return () => {
      app?.destroy(false, { children: true })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  )
}
