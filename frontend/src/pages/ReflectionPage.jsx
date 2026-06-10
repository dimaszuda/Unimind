import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import useSimulationStore from '../store/simulationStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const ALL_QUESTIONS = [
  'Bagaimana arah gaya couloumb jika dua buah muatan sejenis didekatkan? Dan bagaimana jika dua buah muatan berbeda jenis didekatkan?',
  'Bagaimana hubungan antara besarnya muatan terhadap gaya coulomb?',
  'Bagaimana hubungan antara jarak antar muatan terhadap gaya coulomb?',
  'Gaya Coulomb memiliki sebuah konstanta dengan simbol k yang bernilai 9x 10⁹ di ruang hampa atau udara. Konstanta ini menunjukkan besarnya pengaruh medium terhadap interaksi antar muatan listrik. Bagaimana persamaan (rumus) gaya coulomb?',
]

const INTRO =
  'Selamat karena kamu telah menyelesaikan praktikum Hukum Coulomb! Sesi selanjutnya adalah sesi refleksi. Disini kamu akan belajar untuk merefleksikan apa saja yang telah kamu pelajarin di lab tadi. Sesi ini kamu akan ditanyain beberapa pertanyaan. Sudah siap? Yuk mulai! 🚀'

export default function ReflectionPage() {
  const playerName = useSimulationStore(s => s.playerName)
  const selectedStage = useSimulationStore(s => s.selectedStage)

  // Limit questions based on selected stage (1→1 question, 2→2, 3→3, 4→4)
  const totalQuestions = Math.min(Math.max(selectedStage ?? 1, 1), ALL_QUESTIONS.length)
  const QUESTIONS = ALL_QUESTIONS.slice(0, totalQuestions)

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: INTRO },
    { role: 'assistant', content: QUESTIONS[0] },
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReflectionComplete, setIsReflectionComplete] = useState(false)

  // Sliding window: keeps last 3 {role, content} messages for context
  const chatHistoryRef = useRef([])
  // Turn counter for free-chat phase (after reflection questions)
  const freeChatTurnRef = useRef(0)

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const questionAsked = QUESTIONS[currentIndex]

    setChatMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInputValue('')
    setIsLoading(true)

    // Capture current history snapshot before updating
    const history = chatHistoryRef.current

    try {
      if (isReflectionComplete) {
        // Free-chat mode after all reflection questions are done
        const turn = ++freeChatTurnRef.current
        const timestamp = new Date().toLocaleString("sv-SE")
        const t0 = Date.now()
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName, message: trimmed, history }),
        })
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        const responseTime = (Date.now() - t0) / 1000
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])

        // Update sliding window
        chatHistoryRef.current = [
          ...chatHistoryRef.current,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: data.reply },
        ].slice(-3)

        // Fire-and-forget log (lab = refleksi)
        fetch(`${API_BASE}/log/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerName,
            lab: 'refleksi',
            turn,
            timestamp,
            student_message: trimmed,
            ai_message: data.reply,
            response_time: responseTime,
            token_input: data.input_tokens,
            token_output: data.output_tokens,
            total_token: data.total_tokens
          }),
        }).catch(() => {})
      } else {
        // Reflection question mode
        const isLastQuestion = currentIndex + 1 >= totalQuestions
        const t0 = Date.now()
        const res = await fetch(`${API_BASE}/chat/reflection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName, last_question: isLastQuestion, question: questionAsked, answer: trimmed, history }),
        })
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        const responseTime = (Date.now() - t0) / 1000

        setChatMessages(prev => [...prev, { role: 'assistant', content: data.feedback }])

        // Update sliding window
        chatHistoryRef.current = [
          ...chatHistoryRef.current,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: data.feedback },
        ].slice(-3)

        // Fire-and-forget log reflection Q&A
        fetch(`${API_BASE}/log/reflection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerName,
            question: questionAsked,
            student_answer: trimmed,
            ai_feedback: data.feedback,
            response_time: responseTime,
            token_input: data.input_tokens,
            token_output: data.output_tokens,
            total_token: data.total_tokens
          }),
        }).catch(() => {})

        if (isLastQuestion) {
          // Call summary with full conversation history
          const t1 = Date.now()
          const summaryRes = await fetch(`${API_BASE}/chat/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerName, history: chatHistoryRef.current }),
          })
          if (!summaryRes.ok) throw new Error('Summary network response was not ok')
          const summaryData = await summaryRes.json()
          const summaryResponseTime = (Date.now() - t1) / 1000

          setChatMessages(prev => [...prev, { role: 'assistant', content: summaryData.feedback }])

          // Log summary as a chat entry
          fetch(`${API_BASE}/log/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: playerName,
              lab: 'refleksi',
              turn: 0,
              timestamp: new Date().toISOString(),
              student_message: '[Ringkasan Refleksi]',
              ai_message: summaryData.feedback,
              response_time: summaryResponseTime,
              token_input: data.input_tokens,
              token_output: data.output_tokens,
              total_token: data.total_tokens
            }),
          }).catch(() => {})

          setIsReflectionComplete(true)
        } else {
          const nextIndex = currentIndex + 1
          setCurrentIndex(nextIndex)
          setChatMessages(prev => [...prev, { role: 'assistant', content: QUESTIONS[nextIndex] }])
        }
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan saat memproses jawabanmu. Coba lagi ya!' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, currentIndex, isReflectionComplete, playerName, totalQuestions, QUESTIONS])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
        className="min-h-screen flex justify-center relative"
        style={{
          backgroundImage: "url('/assets/Background_Refleksi.png')",
          backgroundSize: "90%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#83ccdf",
          userSelect: 'none',
        }}
      >
        {/* Semi-transparent white overlay */}
        <div className="absolute inset-0 bg-white/50 z-0 flex flex-col items-center justify-center gap-10">
          <div className='absolute left-3 bottom-12 z-12'>
            <img
              src='/assets/Image_Robot.png'
              alt='Timi Bot'
              width={300}
              style={{ transform: 'rotate(7deg)' }}
            />
          </div>
        </div>
        <div className='absolute flex flex-col justify-center items-center right-20 gap-1 mt-4'>
          <div className='relative w-60 h-20 bg-blue-500 border-2 border-blue-500 rounded-3xl flex items-center justify-center'>
            <h2 className='font-bold text-3xl'>Sesi Refleksi</h2>
          </div>
          {/* Panel chat untuk reflection */}
          <div className='relative w-screen max-w-4xl h-96 bg-gray-300 border-2 rounded-3xl p-4 overflow-y-auto flex flex-col gap-3'>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                        em: ({ node, ...props }) => <em {...props} />,
                        h1: ({ node, ...props }) => <h1 className="font-bold text-sm mt-1" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="font-bold text-sm mt-1" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="font-bold text-sm mt-1" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside text-sm" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-sm" {...props} />,
                        li: ({ node, ...props }) => <li {...props} />,
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code className="bg-gray-300 px-1 rounded text-xs" {...props} />
                          ) : (
                            <code className="bg-gray-300 px-1 rounded block text-xs overflow-x-auto" {...props} />
                          ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-black rounded-2xl rounded-bl-none px-4 py-2 flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="relative p-0 border-t-0">
            <textarea
              className="w-screen max-w-4xl h-24 p-2 pr-8 bg-white border border-black rounded-xl resize-none text-black text-xs disabled:opacity-50"
              placeholder={isLoading ? 'Menunggu respons...' : 'Tulis jawabanmu...'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="absolute bottom-6 right-6 hover:opacity-70 transition-opacity disabled:opacity-30"
              aria-label="Kirim pesan"
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
            >
              <img src="/assets/paper-plane.png" alt="kirim" width={20} />
            </button>
          </div>
        </div>
      </div>
  )
}
