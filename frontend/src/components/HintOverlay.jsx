import useSimulationStore from '@/store/simulationStore'

export default function HintOverlay() {
  const { currentHint, clearHint } = useSimulationStore()

  if (!currentHint) return null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-500 rounded-xl px-5 py-3 flex items-center gap-4 shadow-xl max-w-sm">
      <span className="text-sm text-slate-200">{currentHint}</span>
      <button
        onClick={clearHint}
        className="text-slate-400 hover:text-white text-xs shrink-0"
      >
        Tutup
      </button>
    </div>
  )
}
