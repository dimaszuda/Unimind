import { useState, useCallback } from 'react'

const questions = [
    "Bagaimana arah gaya couloumb jika dua buah muatan sejenis didekatkan? Dan bagaimana jika dua buah muatan berbeda jenis didekatkan?",
    "Bagaimana hubungan antara besarnya muatan terhadap gaya coulomb?",
    "Bagaimana hubungan antara jarak antar muatan terhadap gaya coulomb?",
    "Gaya Coulomb memiliki sebuah konstanta dengan simbol k yang bernilai 9x 10⁹ di ruang hampa atau udara. Konstanta ini menunjukkan besarnya pengaruh medium terhadap interaksi antar muatan listrik. Bagaimana persamaan (rumus) gaya coulomb?"
]

/**
 * Hook untuk mengelola sesi refleksi.
 *
 * Nilai yang dikembalikan:
 *   answers  — Array of { question: string, answer: string }
 *              Ini adalah SEMUA jawaban player yang sudah diisi.
 *              Gunakan ini untuk dikirim ke backend saat isComplete === true.
 */
export function useReflectionQuestions() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState([])  // [{ question, answer }, ...]
    const [inputValue, setInputValue] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    const submitAnswer = useCallback((text) => {
        const trimmed = text.trim()
        if (!trimmed || isComplete) return

        const newAnswer = {
            question: questions[currentIndex],
            answer: trimmed,
        }
        const newAnswers = [...answers, newAnswer]
        setAnswers(newAnswers)
        setInputValue('')

        if (currentIndex + 1 >= questions.length) {
            setIsComplete(true)
        } else {
            setCurrentIndex(prev => prev + 1)
        }
    }, [currentIndex, answers, isComplete])

    return {
        currentQuestion: questions[currentIndex] ?? null,
        currentIndex,
        totalQuestions: questions.length,
        answers,          // <-- semua jawaban tersimpan di sini
        inputValue,
        setInputValue,
        submitAnswer,
        isComplete,
    }
}