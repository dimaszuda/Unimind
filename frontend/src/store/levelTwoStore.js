import { create } from 'zustand'

export const useLevelTwoStore = create((set) => ({
  sliderValue: 0,        // -10 to +10 μC — set by the slider
  bolaCharge: 0,         // current bola charge in μC
  statifCharge: 0,       // current statif charge in μC
  bolaState: 'Netral',   // 'Netral' | 'Positif' | 'Negatif'
  statifState: 'Netral', // 'Netral' | 'Positif' | 'Negatif'
  laserDirection: null,  // null | 'left' | 'right'
  laserActive: false,
  laserDistance: null,   // number (px) | null — movement distance from backend (|F| / 10)
  isProcessing: false,
  forceValue: null,      // number (N) | null — only set after both objects are charged

  setSlider: (value) => set({ sliderValue: value }),

  applyShootResult: (result) => set({
    bolaCharge: result.new_bola_charge,
    statifCharge: result.new_statif_charge,
    bolaState: result.new_bola_state,
    statifState: result.new_statif_state,
    laserDirection: result.laser_direction,
    laserActive: result.laser_active,
    laserDistance: result.laser_distance,
    forceValue: result.force_value,
  }),

  setProcessing: (value) => set({ isProcessing: value }),
  setForceValue: (value) => set({ forceValue: value }),
}))
