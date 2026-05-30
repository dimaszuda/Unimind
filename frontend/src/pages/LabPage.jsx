import SimulationCanvas from '@/components/SimulationCanvas'
import ControlPanel from '@/components/ControlPanel'
import HintOverlay from '@/components/HintOverlay'
import { useMonitoring } from '@/hooks/useMonitoring'

export default function LabPage() {
  useMonitoring()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex-1 relative">
        <SimulationCanvas />
        <HintOverlay />
      </div>
      <ControlPanel />
    </div>
  )
}
