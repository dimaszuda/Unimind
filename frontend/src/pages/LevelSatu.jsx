import { useState, useRef, useEffect } from 'react'
import { Link } from "react-router-dom";
import { useLevelOneStore } from '@/store/levelOneStore'
import { useTimiBot } from '@/hooks/useTimiBot'
import TimiBotPanel from '@/components/TimiBotPanel'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function LevelSatu() {
  const {
    selectedCharge, bolaState, statifState,
    laserDirection, laserActive, isProcessing,
    selectCharge, applyShootResult, setProcessing, resetLevelOne,
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
  const [directionSign, setDirectionSign] = useState(null)
  const [isSignBlinking, setIsSignBlinking] = useState(false)

  // Always-fresh snapshot so the stable event handlers never read stale closures
  const latestRef = useRef({})

  // Timi Bot — clue, AFK warning, and affirmation logic
  const { messages: timiMessages, recordInteraction, notifyLaserMoved, addPlayerMessage } = useTimiBot({
    level: 'level1',
    getState: () => latestRef.current,
  })

  latestRef.current = { selectedCharge, bolaState, statifState, isProcessing, studentId, applyShootResult, setProcessing, recordInteraction, notifyLaserMoved }

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
      ? (laserDirection === 'right' ? 'translateX(90px)' : 'translateX(-90px)')
      : 'translateX(0)',
    transition: 'transform 5s ease',
  }

  const ballMovement = {
    transform: laserActive
      ? (laserDirection === 'right'
          ? `translateX(20px)`
          : `translateX(-20px)`)
      : 'translateX(0)',
    transition: 'transform 5s ease',
  }

  const moveSignSrc = directionSign === 'right'
    ? '/assets/move_right.png'
    : '/assets/move_left.png'

  const signPositionClass = directionSign === 'right' ? 'right-4' : 'left-24'

  const handleLauncherMouseDown = (e) => {
    if (!latestRef.current.selectedCharge || latestRef.current.isProcessing) return
    e.preventDefault()
    isDraggingRef.current = true
    setIsDragging(true)
    setDragPos({ x: e.clientX, y: e.clientY })
    latestRef.current.recordInteraction()
  }

  const handleReset = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    setDirectionSign(null)
    setIsSignBlinking(false)
    resetLevelOne()
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
        latestRef.current.recordInteraction()
        if (data.laser_active) latestRef.current.notifyLaserMoved()
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
        <TimiBotPanel messages={timiMessages} onSendMessage={addPlayerMessage} />

        {/* Laser point — animates on charge interaction */}
        <div className='absolute top-8 left-1/2 -translate-x-1/4 z-20 flex justify-center items-center'>
          <img
            src="/assets/penggaris.png"
            alt="penggaris"
            width={700}
            className='relative z-0 max-w-none'
          />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2 z-10'>
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
        <div className='flex flex-col relative items-center justify-center -ml-28' style={{ marginTop: '25rem', transform: `translateX(46px)` }}>
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
            className='absolute -mt-11 -ml-40'
            style={ballMovement}
          />
        </div>

        {/* Navigation bar with launcher and charge selector */}
        <div className='relative flex items-center justify-center'>
          <img
            src="/assets/NavigationBar.png"
            alt="navigation"
            width={172}
            className='relative z-0 mr-32'
          />
          <div className='absolute z-10 flex flex-col items-center justify-center gap-4 mt-5 mr-32'>
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
                onClick={() => { selectCharge('Positif'); recordInteraction() }}
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
                onClick={() => { selectCharge('Negatif'); recordInteraction() }}
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
        <div className='absolute flex justify-center bottom-3 right-20 gap-5 z-40'>
          <button
            type='button'
            onClick={handleReset}
            aria-label='Reset level one tools'
            className='group relative cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200'
          >
            <img
              src='/assets/Button_Refresh.png'
              alt='reset button'
              width={64}
            />
            <span className='pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              Reset Lab
            </span>
          </button>
            <Link to='/reflection'>
                <img
                    src="assets/Button_Lanjutkan.png"
                    alt="Tombol Lanjutkan"
                    width={180}
                    className="cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200"
                />
            </Link>
        </div>
      </div>
    </>
  )
}
