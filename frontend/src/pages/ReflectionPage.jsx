import { useRef, useEffect } from 'react'
import { useReflectionQuestions } from '../hooks/reflectionQuestions'

export default function ReflectionPage() {
  const {
    currentQuestion,
    answers,
    inputValue,
    setInputValue,
    submitAnswer,
    isComplete,
  } = useReflectionQuestions()

  const bottomRef = useRef(null)

  const INTRO = 'Selamat karena kamu telah menyelesaikan praktikum Hukum Coulomb! Sesi selanjutnya adalah sesi refleksi. Disini kamu akan belajar untuk merefleksikan apa saja yang telah kamu pelajarin di lab tadi. Sesi ini kamu akan ditanyain beberapa pertanyaan. Sudah siap? Yuk mulai! 🚀'

  // Bangun pesan chat dari riwayat jawaban + pertanyaan aktif
  const chatMessages = [{ role: 'assistant', content: INTRO }]
  for (const item of answers) {
    chatMessages.push({ role: 'assistant', content: item.question })
    chatMessages.push({ role: 'user', content: item.answer })
  }
  if (!isComplete && currentQuestion) {
    chatMessages.push({ role: 'assistant', content: currentQuestion })
  }
  if (isComplete) {
    chatMessages.push({
      role: 'assistant',
      content: 'Terimakasih telah menjawab, jawaban kamu sedang dievaluasi ✨',
    })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  function handleSubmit() {
    submitAnswer(inputValue)
  }

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
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="relative p-0 border-t-0">
            <textarea
              className="w-screen max-w-4xl h-24 p-2 pr-8 bg-white border border-black rounded-xl resize-none text-black text-xs disabled:opacity-50"
              placeholder={isComplete ? 'Sesi refleksi selesai.' : 'Tulis jawabanmu...'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isComplete}
            />
            <button
              className="absolute bottom-6 right-6 hover:opacity-70 transition-opacity disabled:opacity-30"
              aria-label="Kirim pesan"
              onClick={handleSubmit}
              disabled={isComplete || !inputValue.trim()}
            >
              <img src="/assets/paper-plane.png" alt="kirim" width={20} />
            </button>
          </div>
        </div>
      </div>
  )
}
