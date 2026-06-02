import { create } from 'zustand'

export const useLevelOneStore = create((set) => ({
  selectedCharge: null,   // null | 'Positif' | 'Negatif'
  bolaState: 'Netral',    // 'Netral' | 'Positif' | 'Negatif'
  statifState: 'Netral',  // 'Netral' | 'Positif' | 'Negatif'
  laserDirection: null,   // null | 'left' | 'right'
  laserActive: false,
  isProcessing: false,

  selectCharge: (charge) => set({ selectedCharge: charge }),

  applyShootResult: (result) => set({
    bolaState: result.new_bola_state,
    statifState: result.new_statif_state,
    laserDirection: result.laser_direction,
    laserActive: result.laser_active,
  }),

  setProcessing: (value) => set({ isProcessing: value }),
}))
