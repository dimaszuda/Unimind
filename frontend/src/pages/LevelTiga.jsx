import { useState, useRef, useEffect } from 'react'
import { useLevelTwoStore } from '@/store/levelTwoStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Format force value to fit the small display box
function formatForce(v) {
  if (v === null || v === undefined) return '——'
  return String(Math.round(v))
}

export default function LevelTiga() {
  const {
    sliderValue, bolaCharge, statifCharge,
    bolaState, statifState,
    laserDirection, laserActive, isProcessing,
    laserDistance,
    forceValue,
    setSlider, applyShootResult, setProcessing, setForceValue,
  } = useLevelTwoStore()

  // Distance between charges: 1–10 cm, slider starts at left (1 cm)
  const [distanceValue, setDistanceValue] = useState(1)

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
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })

  // Always-fresh snapshot so the stable event handlers never read stale closures
  const latestRef = useRef({})
  latestRef.current = { sliderValue, bolaCharge, statifCharge, bolaState, statifState, isProcessing, studentId, applyShootResult, setProcessing, distanceValue }

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
          ? `translateX(${laserDistance ? laserDistance+62 : 0}px)`
          : `translateX(-${laserDistance ? laserDistance-62 : 0}px)`)
      : 'translateX(0)',
    transition: 'transform 5s ease',
  }

  // Thumb offset for custom slider visual: -10..+10 maps to ±60px from centre
  const thumbOffset = (sliderValue / 10) * 60

  // Distance slider thumb: 1..10 maps to -60..+60px from centre
  const distanceThumbOffset = ((distanceValue - 1) / 9) * 120 - 60

  // Statif horizontal offset: distance=1 → rightmost (+90px), distance=10 → 0px
  const statifTranslateX = (10 - distanceValue) * 16

  const handleLauncherMouseDown = (e) => {
    if (latestRef.current.sliderValue === 0 || latestRef.current.isProcessing) return
    e.preventDefault()
    isDraggingRef.current = true
    setIsDragging(true)
    setDragPos({ x: e.clientX, y: e.clientY })
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

      const { sliderValue, bolaCharge, statifCharge, isProcessing, studentId, applyShootResult, setProcessing, distanceValue } = latestRef.current
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
        const res = await fetch(`${API_BASE}/level-three/shoot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            launcher_charge: sliderValue,
            target,
            current_bola_charge: bolaCharge,
            current_statif_charge: statifCharge,
            distance_cm: distanceValue,
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

  // Recalculate force whenever distance changes (if both charges are set)
  useEffect(() => {
    if (bolaCharge === 0 || statifCharge === 0) {
      setForceValue(null)
      return
    }
    let cancelled = false
    fetch(`${API_BASE}/level-three/force`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance_cm: distanceValue, q1: statifCharge, q2: bolaCharge }),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setForceValue(data.force_value) })
      .catch((err) => console.error('Force calc error:', err))
    return () => { cancelled = true }
  }, [distanceValue, bolaCharge, statifCharge]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
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
          backgroundImage: "url('/assets/BackgroundLab.png')",
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
        <div className='relative mt-24 translate-x-60'>
          <img
            src="/assets/Icon_LasserPoint.png"
            alt="laser point"
            width={15}
            style={laserStyle}
          />
        </div>

        {/* Statif (drop target) */}
        <div className='flex flex-col relative items-center justify-center -ml-28' style={{ marginTop: '27rem' }}>
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
            className='z-0 -mt-56 mr-[124px]'
            style={{ transform: `translateX(${statifTranslateX}px)` }}
          />
          
          <div className="flex flex-col items-center justify-center mt-4 mr-36 w-48 h-16 bg-white/50 border border-white rounded-2xl gap-3">
            <div className="flex items-center justify-center gap-2">
              <div className="flex w-20 h-6 bg-white border-2 border-blue-500 rounded-lg items-center justify-center">
                <p className="font-semibold text-black text-xs">Jarak (s)</p>
              </div>
              <div className="flex bg-white w-16 h-6 border-2 border-sky-500 rounded-md items-center justify-center gap-2">
                <p className='font-bold text-black text-xs'>
                  {distanceValue}
                </p>
                <p className='font-bold text-black text-xs'>Cm</p>
              </div>
            </div>

            <div className='relative flex items-center justify-center'>
              <img
                src="/assets/Tool_Slider.png"
                alt="tool slider"
                width={144}
                className='h-auto'
                style={{ pointerEvents: 'none' }}
              />
              {/* Thumb image tracks distance slider value */}
              <img
                src="/assets/Button_SliderTool.png"
                alt="slider thumb"
                width={8}
                className='absolute'
                style={{
                  left: `calc(50% + ${distanceThumbOffset}px)`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }}
              />
              {/* Invisible range input for distance: 1–10 cm, starts at left */}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={distanceValue}
                onChange={(e) => setDistanceValue(Number(e.target.value))}
                className='absolute cursor-pointer'
                style={{ width: '144px', opacity: 0, height: '24px', margin: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Bola (drop target) */}
        <div className='relative flex items-center justify-center mt-[52px] ml-10'>
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
      </div>
    </>
  )
}
