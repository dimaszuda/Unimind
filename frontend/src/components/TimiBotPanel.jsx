import { useRef, useEffect, useState } from 'react'

/**
 * TimiBotPanel — chat panel used in every lab level.
 *
 * Props:
 *   messages      — array from useTimiBot: { id, sender, text }
 *   onSendMessage — called with the trimmed string when the player sends a chat
 */
export default function TimiBotPanel({ messages, onSendMessage }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSendMessage(text)
    setInput('')
  }

  return (
    <div className='flex flex-col relative items-center justify-center mt-24 mr-48'>
      <div className="flex flex-col w-80 h-80 bg-gray-500/15 border-2 rounded-2xl border-white ml-20 overflow-hidden">

        {/* ── Messages area ─────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-0"
        >
          {messages.length === 0 && (
            <p className="text-white/70 text-xs text-center mt-2 italic">
              Timi Bot siap membantu!
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed break-words ${
                  msg.sender === 'bot'
                    ? 'bg-white/90 text-gray-800 rounded-tl-none shadow-sm'
                    : 'bg-blue-500 text-white rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* ── Input area ────────────────────────────────────────────── */}
        <div className="relative p-2 border-t border-white/20">
          <textarea
            className="w-full h-14 p-2 pr-8 bg-white border border-gray-300 rounded-xl resize-none text-black text-xs"
            placeholder="Tulis pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            className="absolute bottom-4 right-4 hover:opacity-70 transition-opacity"
            onClick={handleSend}
            aria-label="Kirim pesan"
          >
            <img src="/assets/paper-plane.png" alt="kirim" width={20} />
          </button>
        </div>
      </div>

      <img
        src="/assets/Image_Robot.png"
        alt="Timi Bot"
        width={160}
        className="ml-36 -mt-4 relative z-10"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  )
}
