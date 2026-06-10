import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ─── Timing constants ──────────────────────────────────────────────────────
const CLUE_INTERVAL_MS = 60_000   // check every 1 minute
const CLUE_MAX_CHECKS  = 10       // stop after 10 minutes
const AFK_INTERVAL_MS  = 300_000  // check every 5 minutes
const AFK_MAX_CHECKS   = 6        // stop after 30 minutes

// ─── Affirmation pool (rotates) ────────────────────────────────────────────
const AFFIRMATION_PAIRS = [
  {
    praise:  'Hebat! Laser berhasil bergerak! Kamu bisa melihat gaya Coulomb bekerja! 🎉',
    followup: 'Sekarang coba dengan nilai muatan yang berbeda dan amati apa yang berubah! 🔬',
  },
  {
    praise:  'Luar biasa! Interaksi antar muatan membuat laser berpindah posisi! ⚡',
    followup: 'Coba ubah jenis muatannya (positif/negatif) — apakah arah gerak lasernya berubah? 🧪',
  },
  {
    praise:  'Kerja bagus! Eksperimenmu berhasil dengan sempurna! 🌟',
    followup: 'Coba ubah nilai muatan bola atau statif dan amati bagaimana laser bereaksi! 📊',
  },
]

// ─── Context-aware clue messages per level ─────────────────────────────────
function getContextualClue(level, state) {
  if (level === 'level1') {
    if (!state.selectedCharge) {
      return 'Hai! Klik ikon muatan positif (+) atau negatif (-) di panel bawah untuk mulai bereksperimen! 🔬'
    }
    if (state.bolaState === 'Netral' && state.statifState === 'Netral') {
      return 'Muatan sudah dipilih! Sekarang seret penembak muatan ke bola atau statif di lab untuk memberikan muatan. 🎯'
    }
    if (state.bolaState !== 'Netral' && state.statifState === 'Netral') {
      return 'Bola sudah bermuatan! Coba berikan muatan pada statif juga — seret penembak muatan ke statif. ⚡'
    }
    if (state.bolaState === 'Netral' && state.statifState !== 'Netral') {
      return 'Statif sudah bermuatan! Sekarang berikan muatan pada bola juga — seret penembak muatan ke bola. 🔋'
    }
    return 'Coba ubah jenis muatan penembak (positif/negatif) dan amati perbedaan arah gerak laser! 🧪'
  }

  if (level === 'level2') {
    if (state.sliderValue === 0) {
      return 'Hai! Geser slider ke kanan (+) atau kiri (-) untuk mengatur nilai muatan penembak. 🎚️'
    }
    if (state.bolaCharge === 0 && state.statifCharge === 0) {
      return 'Nilai muatan sudah diatur! Seret penembak muatan ke bola atau statif untuk menembakkan. 🎯'
    }
    if ((state.bolaCharge !== 0) !== (state.statifCharge !== 0)) {
      return 'Bagus! Satu benda sudah bermuatan. Tembakkan juga ke benda satunya untuk melihat gaya Coulomb! ⚡'
    }
    return 'Coba ubah nilai slider dan tembak ulang untuk melihat bagaimana gaya Coulomb berubah! 📊'
  }

  if (level === 'level3') {
    if (state.sliderValue === 0) {
      return 'Hai! Geser slider muatan ke kanan (+) atau kiri (-) untuk memilih nilai muatan penembak. 🎚️'
    }
    if (state.bolaCharge === 0 && state.statifCharge === 0) {
      return 'Nilai muatan sudah diatur! Seret penembak muatan ke bola atau statif untuk menembakkan. 🎯'
    }
    if ((state.bolaCharge !== 0) !== (state.statifCharge !== 0)) {
      return 'Satu benda bermuatan! Tembakkan ke benda lainnya juga, lalu coba ubah slider jarak untuk melihat efeknya! ⚡'
    }
    return 'Coba ubah slider jarak (s) dan amati bagaimana jarak mempengaruhi besar gaya Coulomb! 📏'
  }

  return null
}

// ─── Hook ──────────────────────────────────────────────────────────────────
/**
 * useTimiBot — static Timi Bot logic for lab pages.
 *
 * @param {{ level: 'level1'|'level2'|'level3', getState: () => object, playerName?: string }} opts
 *   `getState` is called on timer ticks and must return the current lab state snapshot.
 *   `playerName` is sent to the backend when the player asks a question.
 *
 * @returns {{
 *   messages: Array<{id:number, sender:'bot'|'player', text:string, timestamp:number}>,
 *   isThinking: boolean,
 *   recordInteraction: () => void,
 *   notifyLaserMoved: () => void,
 *   addPlayerMessage: (text:string) => void,
 *   sendPlayerMessage: (text:string) => void,
 * }}
 */
export function useTimiBot({ level, getState, playerName = 'student' }) {
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)

  // Tracks last meaningful game interaction (charge select, drag, shoot)
  const lastInteractionRef   = useRef(Date.now())
  // Tracks last ANY activity (mouse move/click/key) — used for AFK
  const lastActivityRef      = useRef(Date.now())
  const clueCheckCountRef    = useRef(0)
  const afkCheckCountRef     = useRef(0)
  const affirmationIndexRef  = useRef(0)
  const messageIdRef         = useRef(0)
  // Sliding window: keeps last 3 {role, content} messages for context
  const chatHistoryRef       = useRef([])
  // Tracks sequential turn number for logging
  const turnRef              = useRef(0)
  // Keep getState fresh without re-creating effects on every render
  const getStateRef          = useRef(getState)
  getStateRef.current = getState

  // ── Primitive helpers ────────────────────────────────────────────────────
  const addMessage = useCallback((text, sender = 'bot') => {
    const id = ++messageIdRef.current
    setMessages((prev) => [...prev, { id, sender, text, timestamp: Date.now() }])
  }, [])

  /**
   * Call on meaningful game actions (charge selection, launcher drag start,
   * successful shoot) to reset the idle-clue countdown.
   */
  const recordInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
    lastActivityRef.current    = Date.now()
  }, [])

  /**
   * Call immediately after a successful shoot that produced laser movement.
   * Sends two bot messages: praise + follow-up invitation.
   */
  const notifyLaserMoved = useCallback(() => {
    const idx = affirmationIndexRef.current % AFFIRMATION_PAIRS.length
    const { praise, followup } = AFFIRMATION_PAIRS[idx]
    affirmationIndexRef.current++
    addMessage(praise)
    // Stagger the follow-up message slightly for a more natural feel
    setTimeout(() => addMessage(followup), 2500)
  }, [addMessage])

  /** Add a player-typed chat message to the history. */
  const addPlayerMessage = useCallback((text) => {
    addMessage(text, 'player')
  }, [addMessage])

  /**
   * Send a player message to the backend /chat/lab-chat endpoint,
   * show the response from Timi, and reset the clue interval.
   */
  const sendPlayerMessage = useCallback(async (text) => {
    if (!text) return
    // Show the player's message immediately
    addMessage(text, 'player')
    // Reset idle / AFK timers — asking a question counts as activity
    lastInteractionRef.current = Date.now()
    lastActivityRef.current    = Date.now()
    clueCheckCountRef.current  = 0

    // Capture current history snapshot before updating
    const history = chatHistoryRef.current
    const turn    = ++turnRef.current
    const timestamp = new Date().toLocaleString("sv-SE")

    setIsThinking(true)
    try {
      const levelSuffix = { level1: 'one', level2: 'two', level3: 'three' }[level]
      const t0 = Date.now()
      const res = await fetch(`${API_BASE}/chat/lab-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, message: text, lab: levelSuffix, history }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const responseTime = (Date.now() - t0) / 1000
      addMessage(data.reply)

      // Update sliding window: add user + assistant, keep last 3
      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: data.reply },
      ].slice(-3)

      console.log({
        name: playerName,
        lab: levelSuffix,
        turn,
        timestamp,
        student_message: text,
        ai_message: data.reply,
        response_time: responseTime,
        token_input: data.input_tokens,
        token_output: data.output_tokens,
        total_token: data.total_tokens
      })

      // Fire-and-forget: log to spreadsheet (errors are silent)
      fetch(`${API_BASE}/log/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          lab: levelSuffix,
          turn,
          timestamp,
          student_message: text,
          ai_message: data.reply,
          response_time: responseTime,
          token_input: data.input_tokens,
          token_output: data.output_tokens,
          total_token: data.total_tokens
        }),
      }).catch(() => {})
    } catch {
      addMessage('Ups, Timi sedang tidak bisa menjawab. Coba lagi sebentar ya! 🙏')
    } finally {
      setIsThinking(false)
    }
  }, [addMessage, playerName, level])

  // ── Track all mouse / keyboard activity for AFK detection ────────────────
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('mousedown', onActivity)
    window.addEventListener('keydown',   onActivity)
    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('mousedown', onActivity)
      window.removeEventListener('keydown',   onActivity)
    }
  }, [])

  // ── Clue timer: every 1 minute, for the first 10 minutes ─────────────────
  useEffect(() => {
    clueCheckCountRef.current = 0
    const id = setInterval(() => {
      if (clueCheckCountRef.current >= CLUE_MAX_CHECKS) {
        clearInterval(id)
        return
      }
      clueCheckCountRef.current++

      const idleMs = Date.now() - lastInteractionRef.current
      if (idleMs >= CLUE_INTERVAL_MS) {
        const clue = getContextualClue(level, getStateRef.current())
        if (clue) addMessage(clue)
      }
    }, CLUE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [level, addMessage])

  // ── AFK timer: every 5 minutes, for the first 30 minutes ─────────────────
  useEffect(() => {
    afkCheckCountRef.current = 0
    const id = setInterval(() => {
      if (afkCheckCountRef.current >= AFK_MAX_CHECKS) {
        clearInterval(id)
        return
      }
      afkCheckCountRef.current++

      const afkMs = Date.now() - lastActivityRef.current
      if (afkMs >= AFK_INTERVAL_MS) {
        addMessage('Apakah kamu masih bermain lab? 👋')
      }
    }, AFK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [addMessage])

  return { messages, isThinking, recordInteraction, notifyLaserMoved, addPlayerMessage, sendPlayerMessage }
}
