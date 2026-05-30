import { useEffect } from 'react'
import useSimulationStore from '@/store/simulationStore'
import { monitoringRules } from '@/monitoring/monitoringRules'

const CHECK_INTERVAL = 5_000  // cek tiap 5 detik

export function useMonitoring() {
  const store = useSimulationStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useSimulationStore.getState()

      for (const rule of monitoringRules) {
        const hint = rule.check(state)
        if (hint) {
          state.setHint(hint)
          break  // tampilkan satu hint saja per cycle
        }
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}
