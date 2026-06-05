import { useState, useRef, useEffect } from 'react'
import { useLevelTwoStore } from '@/store/levelTwoStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Format force value to fit the small display box
function formatForce(v) {
  if (v === null || v === undefined) return '——'
  return String(Math.round(v))
}

export default function LevelDua() {
  const {
    sliderValue, bolaCharge, statifCharge,
    bolaState, statifState,
    laserDirection, laserActive, isProcessing,
    laserDistance,
    forceValue,
    setSlider, applyShootResult, setProcessing,
    resetLevelTwo
  } = useLevelTwoStore()

  const [studentId] = useState(() => {
    const existing = sessionStorage.getItem('student_id')
    if (existing) return existing
    const id = 'student_' + Math.random().toString(36).substring(2, 9)
    sessionStorage.setItem('student_id', id)
    return id
  })

  const bolaRef = useRef(null)
  const statifRef = useRef(null)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [directionSign, setDirectionSign] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [isSignBlinking, setIsSignBlinking] = useState(false)

  // Always-fresh snapshot so the stable event handlers never read stale closures
  const latestRef = useRef({})
  latestRef.current = { sliderValue, bolaCharge, statifCharge, bolaState, statifState, isProcessing, studentId, applyShootResult, setProcessing }

  // Launcher image driven by slider sign
  const launcherSrc = sliderValue > 0
    ? '/assets/Tool_PenembakMuatanPositif.png'
    : sliderValue < 0
    ? '/assets/Tool_PenembakMuatanNegatif.png'
    : '/assets/Tool_PenembakMuatanNetral.png'

  const bolaSrc = bolaState === 'Positif'
    ? '/assets/Tool_BolaPositif.png'
    : bolaState === 'Negatif'
    ? '/assets/Tool_BolaNegatif.png'
    : '/assets/Tool_BolaNetral.png'

  const statifSrc = statifState === 'Positif'
    ? '/assets/Tool_StatifPositif.png'
    : statifState === 'Negatif'
    ? '/assets/Tool_StatifNegatif.png'
    : '/assets/Tool_StatifNetral.png'

  const laserStyle = {
    transform: laserActive
      ? (laserDirection === 'right'
          ? `translateX(${laserDistance ? laserDistance+30 : 0}px)`
          : `translateX(-${laserDistance ? laserDistance-7 : 0}px)`)
      : 'translateX(0)',
    transition: 'transform 5s ease',
  }

  const moveSignSrc = directionSign === 'right'
    ? '/assets/move_right.png'
    : '/assets/move_left.png'

  const signPositionClass = directionSign === 'right' ? 'right-4' : 'left-24'

  // Thumb offset for custom slider visual: -10..+10 maps to ±60px from centre
  const thumbOffset = (sliderValue / 10) * 60

  const handleLauncherMouseDown = (e) => {
    if (latestRef.current.sliderValue === 0 || latestRef.current.isProcessing) return
    e.preventDefault()
    isDraggingRef.current = true
    setIsDragging(true)
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  const handleReset = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    setDirectionSign(null)
    setIsSignBlinking(false)
    resetLevelTwo()
  }

  // Register mouse listeners ONCE — read all state via latestRef (never stale)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      setDragPos({ x: e.clientX, y: e.clientY })
    }
    const onMouseUp = async (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)

      const { sliderValue, bolaCharge, statifCharge, isProcessing, studentId, applyShootResult, setProcessing } = latestRef.current
      if (sliderValue === 0 || isProcessing) return

      const { clientX, clientY } = e
      const isHit = (ref) => {
        if (!ref.current) return false
        const r = ref.current.getBoundingClientRect()
        return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
      }

      let target = null
      if (isHit(bolaRef)) target = 'bola'
      else if (isHit(statifRef)) target = 'statif'
      if (!target) return

      setProcessing(true)
      try {
        const res = await fetch(`${API_BASE}/level-two/shoot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            launcher_charge: sliderValue,
            target,
            current_bola_charge: bolaCharge,
            current_statif_charge: statifCharge,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        applyShootResult(data)
      } catch (err) {
        console.error('Shoot error:', err)
      } finally {
        setProcessing(false)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, []) // empty deps — stable forever, reads via latestRef

  useEffect(() => {
    if (!laserActive || (laserDirection !== 'left' && laserDirection !== 'right')) return

    setDirectionSign(laserDirection)
    setIsSignBlinking(true)

    const timeoutId = setTimeout(() => {
      setIsSignBlinking(false)
      setDirectionSign(null)
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [laserActive, laserDirection])

  return (
    <>
      <style>{`
        @keyframes sign-blink-fast {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Ghost image that follows the cursor while dragging */}
      {isDragging && (
        <img
          src={launcherSrc}
          width={80}
          alt=""
          style={{
            position: 'fixed',
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.85,
          }}
        />
      )}

      <div
        className="min-h-screen flex justify-center"
        style={{
          backgroundImage: "url('/assets/Background_Lab.png')",
          backgroundSize: "90%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#83ccdf",
          userSelect: 'none',
        }}
      >
        {/* Timi Bot panel */}
        <div className='flex flex-col relative items-center justify-center mt-24 mr-48'>
          <div className="flex justify-center items-end w-80 h-80 bg-gray-500/15 border-2 rounded-2xl border-white ml-20">
            <div className="relative mb-4">
              <textarea
                className="w-72 h-28 p-3 bg-white border-2 border-black rounded-2xl resize-none text-black"
                placeholder="Tulis pesan..."
              />
              <button className="absolute bottom-4 right-3">
                <img
                  src="/assets/paper-plane.png"
                  alt="send chat"
                  width={24}
                />
              </button>
            </div>
          </div>
          <img
            src="/assets/Image_Robot.png"
            alt="Timi Bot"
            width={160}
            className='ml-36 -mt-4 relative z-10'
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>

        {/* Laser point — animates on charge interaction */}
        <div className='absolute top-12 left-1/2 -translate-x-1/4 z-20 flex justify-center items-center'>
          <img
            src="/assets/Asset_PenggarisGayaColoumb.png"
            alt="penggaris"
            width={600}
            className='relative z-0'
          />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-7 z-10'>
            <img
              src="/assets/Icon_LasserPoint.png"
              alt="laser point"
              width={15}
              style={laserStyle}
            />
          </div>
          {directionSign && (
            <div className={`absolute bottom-4 z-10 ${signPositionClass}`}>
              <img
                src={moveSignSrc}
                alt="sign"
                width={100}
                style={isSignBlinking ? { animation: 'sign-blink-fast 0.22s steps(1, end) infinite' } : undefined}
              />
            </div>
          )}
        </div>

        {/* Statif (drop target) */}
        <div className='flex flex-col relative items-center justify-center -ml-28' style={{ marginTop: '25rem' }}>
          <img
            src="/assets/Tool_RulerStatif.png"
            alt="ruler"
            width={200}
            className='relative mr-36'
          />
          <img
            ref={statifRef}
            src={statifSrc}
            alt="tool statif"
            width={200}
            className='z-10 -mt-56 ml-20'
          />
        </div>

        {/* Bola (drop target) */}
        <div className='relative flex items-center justify-center mt-24 ml-10'>
          <img
            src="/assets/Tool_PenggantungBola.png"
            alt="penggantung bola"
            width={185}
            className='mb-8 relative z-20'
          />
          <img
            ref={bolaRef}
            src={bolaSrc}
            alt="bola"
            width={36}
            className='absolute -mt-12 -ml-40'
          />
        </div>

        {/* Navigation bar with launcher, slider, and read-only data display */}
        <div className='relative flex items-center justify-center'>
          <img
            src="/assets/NavigationBarTahap2.png"
            alt="navigation"
            width={172}
            className='relative z-0 mr-32'
          />
          <div className='absolute z-10 flex flex-col items-center justify-center gap-4 mt-8 mr-32'>
            {/* Launcher + charge value side by side */}
            <div className='flex items-center gap-1'>
              <img
                src={launcherSrc}
                alt="penembak muatan"
                width={100}
                draggable="false"
                onMouseDown={handleLauncherMouseDown}
                style={{
                  cursor: sliderValue !== 0 && !isProcessing ? 'grab' : 'default',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              />
              <div className="flex bg-white w-10 h-6 border-2 border-sky-500 rounded-md items-center justify-center gap-0.5">
                <p className='font-bold text-black text-xs'>
                  {sliderValue > 0 ? `+${sliderValue}` : sliderValue}
                </p>
                <p className='font-bold text-black text-xs'>&mu;C</p>
              </div>
            </div>

            {/* Interactive slider — overlays a transparent range input on the image */}
            <div className='relative flex items-center justify-center'>
              <img
                src="/assets/Tool_Slider.png"
                alt="tool slider"
                width={144}
                className='h-auto'
                style={{ pointerEvents: 'none' }}
              />
              {/* Thumb image tracks slider value */}
              <img
                src="/assets/Button_SliderTool.png"
                alt="slider thumb"
                width={8}
                className='absolute'
                style={{
                  left: `calc(50% + ${thumbOffset}px)`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }}
              />
              {/* Invisible range input captures user interaction */}
              <input
                type="range"
                min={-10}
                max={10}
                step={1}
                value={sliderValue}
                onChange={(e) => setSlider(Number(e.target.value))}
                className='absolute cursor-pointer'
                style={{ width: '144px', opacity: 0, height: '24px', margin: 0 }}
              />
            </div>

            {/* Read-only data display */}
            <div className='relative flex flex-col gap-2'>
              <div className='relative flex gap-2'>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center">
                  <p className='font-bold text-black text-xs'>Muatan 1</p>
                </div>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center gap-2">
                  <p className='font-bold text-black text-xs'>
                    {statifCharge !== 0 ? (statifCharge > 0 ? `+${statifCharge}` : statifCharge) : '——'}
                  </p>
                  <p className='font-bold text-black text-xs'>&mu;C</p>
                </div>
              </div>
              <div className='relative flex gap-2'>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center">
                  <p className='font-bold text-black text-xs'>Muatan 2</p>
                </div>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center gap-2">
                  <p className='font-bold text-black text-xs'>
                    {bolaCharge !== 0 ? (bolaCharge > 0 ? `+${bolaCharge}` : bolaCharge) : '——'}
                  </p>
                  <p className='font-bold text-black text-xs'>&mu;C</p>
                </div>
              </div>
              <div className='relative flex gap-2'>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center">
                  <p className='font-bold text-black text-xs'>Gaya F</p>
                </div>
                <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center gap-2">
                  <p className='font-bold text-black text-xs'>{formatForce(forceValue)}</p>
                  <p className='font-bold text-black text-xs'>N</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type='button'
          className='absolute bottom-4 right-20'
          onClick={handleReset}
          aria-label='Reset level two tools'
        >
          <img
            src='/assets/Button_Refresh.png'
            alt='reset button'
            width={64}
          />
        </button>
      </div>
    </>
  )
}
