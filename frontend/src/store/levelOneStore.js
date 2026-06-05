import { create } from 'zustand'

const initialLevelOneState = {
  selectedCharge: null,
  bolaState: 'Netral',
  statifState: 'Netral',
  laserDirection: null,
  laserActive: false,
  isProcessing: false,
}

export const useLevelOneStore = create((set) => ({
  ...initialLevelOneState,

  selectCharge: (charge) => set({ selectedCharge: charge }),

  applyShootResult: (result) => set({
    bolaState: result.new_bola_state,
    statifState: result.new_statif_state,
    laserDirection: result.laser_direction,
    laserActive: result.laser_active,
  }),

  setProcessing: (value) => set({ isProcessing: value }),
  resetLevelOne: () => set({ ...initialLevelOneState }),
}))
