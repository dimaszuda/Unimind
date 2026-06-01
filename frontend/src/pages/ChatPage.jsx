import { useState, useRef, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// student_id sederhana berbasis session — bisa diganti Supabase Auth nanti

function getStudentId() {
  let id = sessionStorage.getItem('student_id')
  if (!id) {
    id = 'student_' + Math.random().toString(36).slice(2, 9)
    sessionStorage.setItem('student_id', id)
  }
  return id
}

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const studentId = getStudentId()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          messages: nextMessages,
        }),
      })

      if (!res.ok) throw new Error('Gagal menghubungi server')

      const data = await res.json()
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan. Coba lagi ya.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <a href="/" className="text-slate-400 hover:text-white text-sm">
          &larr; Kembali ke Lab
        </a>
        <h1 className="text-xl font-semibold">Tanya AI &mdash; Hukum Coulomb</h1>
      </div>

      <div className="flex-1 bg-slate-800 rounded-lg p-4 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-slate-400 text-sm">
            Mulai percakapan dengan mengetik pertanyaanmu di bawah.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 px-4 py-2 rounded-xl text-sm">
              Sedang mengetik...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan sesuatu tentang Hukum Coulomb..."
          className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium"
        >
          Kirim
        </button>
      </div>
    </div>
  )
}
