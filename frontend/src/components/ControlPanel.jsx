import useSimulationStore from '@/store/simulationStore'

export default function ControlPanel() {
  const { charges, forceVector, updateChargeValue, recordInteraction } = useSimulationStore()

  const handleSliderChange = (id, rawValue) => {
    // rawValue dari slider: -10 sampai 10 (dalam satuan mikro-coulomb)
    const value = parseFloat(rawValue) * 1e-6
    updateChargeValue(id, value)
    recordInteraction()
  }

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 p-5 flex flex-col gap-6 overflow-y-auto">
      <h2 className="text-lg font-semibold">Kontrol Simulasi</h2>

      {charges.map((charge) => {
        const valueMicro = (charge.value / 1e-6).toFixed(1)
        const label = charge.id === 'q1' ? 'Muatan 1 (q1)' : 'Muatan 2 (q2)'
        const color = charge.value >= 0 ? 'text-red-400' : 'text-blue-400'

        return (
          <div key={charge.id} className="flex flex-col gap-2">
            <label className={`text-sm font-medium ${color}`}>{label}</label>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={valueMicro}
              onChange={(e) => handleSliderChange(charge.id, e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-slate-400">
              {valueMicro} &mu;C
            </span>
          </div>
        )
      })}

      <div className="mt-auto pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-1">Gaya Coulomb</p>
        <p className="text-2xl font-bold text-white">
          {forceVector.magnitude.toExponential(2)}{' '}
          <span className="text-sm font-normal text-slate-400">{forceVector.unit}</span>
        </p>
      </div>
    </div>
  )
}
