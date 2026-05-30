// Rule engine murni frontend — tidak ada server call
// Setiap rule adalah fungsi (state) => string | null
// Return string = tampilkan hint, return null = tidak ada hint

export const monitoringRules = [
  {
    id: 'afk_no_charge',
    check: (state) => {
      const idle = Date.now() - state.lastInteractionAt
      if (idle > 30_000 && state.charges.length === 0) {
        return 'Coba letakkan muatan pertama di kanvas!'
      }
      return null
    },
  },
  {
    id: 'afk_one_charge',
    check: (state) => {
      const idle = Date.now() - state.lastInteractionAt
      if (idle > 45_000 && state.charges.length === 1) {
        return 'Tambahkan muatan kedua untuk melihat gaya Coulomb!'
      }
      return null
    },
  },
  {
    id: 'afk_two_charges',
    check: (state) => {
      const idle = Date.now() - state.lastInteractionAt
      if (idle > 60_000 && state.charges.length >= 2) {
        return 'Coba ubah nilai muatan atau posisinya. Perhatikan apa yang terjadi!'
      }
      return null
    },
  },
  {
    id: 'force_zero',
    check: (state) => {
      if (
        state.charges.length >= 2 &&
        state.forceVector.magnitude === 0
      ) {
        return 'Pastikan nilai kedua muatan tidak nol agar gaya Coulomb muncul.'
      }
      return null
    },
  },
]
