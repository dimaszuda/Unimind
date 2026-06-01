import { create } from 'zustand'

// Store utama sebagai jembatan Pixi <-> React
// Pixi baca/tulis store ini, React subscribe untuk update UI

const useSimulationStore = create((set, get) => ({
  // --- State Muatan ---
  charges: [
    // { id: 'q1', x: 300, y: 300, value: 1e-6, vx: 0, vy: 0 }
    // { id: 'q2', x: 500, y: 300, value: -1e-6, vx: 0, vy: 0 }
  ],

  // --- State Gaya ---
  forceVector: { magnitude: 0, unit: 'N' },

  // --- State Player ---
  playerName: '',
  selectedStage: null,

  setPlayer: (name, stage) => set({ playerName: name, selectedStage: stage }),

  // --- State Monitoring ---
  lastInteractionAt: Date.now(),
  currentHint: null,

  // --- Actions ---
  setCharges: (charges) => set({ charges }),

  updateChargeValue: (id, value) =>
    set((state) => ({
      charges: state.charges.map((c) =>
        c.id === id ? { ...c, value } : c
      ),
    })),

  updateChargePosition: (id, x, y) =>
    set((state) => ({
      charges: state.charges.map((c) =>
        c.id === id ? { ...c, x, y } : c
      ),
    })),

  setForceVector: (forceVector) => set({ forceVector }),

  recordInteraction: () => set({ lastInteractionAt: Date.now() }),

  setHint: (hint) => set({ currentHint: hint }),

  clearHint: () => set({ currentHint: null }),
}))

export default useSimulationStore
