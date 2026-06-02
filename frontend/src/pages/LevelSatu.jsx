import { useState, useRef, useEffect } from 'react'
import { useLevelOneStore } from '@/store/levelOneStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function LevelSatu() {
  const {
    selectedCharge, bolaState, statifState,
    laserDirection, laserActive, isProcessing,
    selectCharge, applyShootResult, setProcessing,
  } = useLevelOneStore()

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
  latestRef.current = { selectedCharge, bolaState, statifState, isProcessing, studentId, applyShootResult, setProcessing }

  const launcherSrc = selectedCharge === 'Positif'
    ? '/assets/Tool_PenembakMuatanPositif.png'
    : selectedCharge === 'Negatif'
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
      ? (laserDirection === 'right' ? 'translateX(120px)' : 'translateX(-120px)')
      : 'translateX(0)',
    transition: 'transform 0.6s ease',
  }

  const handleLauncherMouseDown = (e) => {
    if (!latestRef.current.selectedCharge || latestRef.current.isProcessing) return
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

      const { selectedCharge, bolaState, statifState, isProcessing, studentId, applyShootResult, setProcessing } = latestRef.current
      if (!selectedCharge || isProcessing) return

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
        const res = await fetch(`${API_BASE}/level-one/shoot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            launcher_charge: selectedCharge,
            target,
            current_bola_state: bolaState,
            current_statif_state: statifState,
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
            left: dragPos.x - 40,
            top: dragPos.y - 40,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.85,
          }}
        />
      )}

      <div
        className="min-h-screen flex"
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
        <div className='flex flex-col relative items-center justify-center mt-24'>
          <div className='w-60 h-80 bg-gray-500/15 border-2 rounded-2xl border-white ml-20'></div>
          <img
            src="/assets/Image_Robot.png"
            alt="Timi Bot"
            width={160}
            className='ml-36 -mt-4 relative z-10'
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>

        {/* Laser point — animates on charge interaction */}
        <div className='relative ml-48 mt-24'>
          <img
            src="/assets/Icon_LasserPoint.png"
            alt="laser point"
            width={15}
            style={laserStyle}
          />
        </div>

        {/* Statif (drop target) */}
        <div className='flex flex-col relative items-center justify-center -ml-28' style={{ marginTop: '19rem' }}>
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
        <div className='relative flex items-center justify-center mt-2 ml-10'>
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

        {/* Navigation bar with launcher and charge selector */}
        <div className='relative flex items-center justify-center'>
          <img
            src="/assets/NavigationBar.png"
            alt="navigation"
            width={172}
            className='relative z-0'
          />
          <div className='absolute z-10 flex flex-col items-center justify-center gap-4 mt-5'>
            <div className='flex items-center justify-center gap-1'>
              {/* Launcher — drag this onto bola or statif */}
              <img
                src={launcherSrc}
                alt="penembak muatan"
                width={100}
                draggable="false"
                onMouseDown={handleLauncherMouseDown}
                style={{
                  cursor: selectedCharge && !isProcessing ? 'grab' : 'default',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              />
              {/* Muatan Positif selector */}
              <img
                src="/assets/Tool_MuatanPositif.png"
                alt="muatan positif"
                width={20}
                className='h-auto'
                onClick={() => selectCharge('Positif')}
                style={{
                  cursor: 'pointer',
                  outline: selectedCharge === 'Positif' ? '2px solid #ef4444' : 'none',
                  borderRadius: '50%',
                }}
              />
              {/* Muatan Negatif selector */}
              <img
                src="/assets/Tool_MuatanNegatif.png"
                alt="muatan negatif"
                width={20}
                className='h-auto'
                onClick={() => selectCharge('Negatif')}
                style={{
                  cursor: 'pointer',
                  outline: selectedCharge === 'Negatif' ? '2px solid #3b82f6' : 'none',
                  borderRadius: '50%',
                }}
              />
            </div>
            <div className='relative flex items-center justify-center'>
              <img
                src="/assets/Tool_Slider.png"
                alt="tool slider"
                width={144}
                className='h-auto'
              />
              <img
                src="/assets/Button_SliderTool.png"
                alt="slider"
                width={8}
                className='absolute'
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
