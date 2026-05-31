import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import LabPage from '@/pages/LabPage'
import ChatPage from '@/pages/ChatPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lab" element={<LabPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}
