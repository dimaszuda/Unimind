import { Routes, Route } from 'react-router-dom'
import LabPage from '@/pages/LabPage'
import ChatPage from '@/pages/ChatPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LabPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}
