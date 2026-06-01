import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import HowToPlayPage from '@/pages/HowToPlayPage'
import LabPage from '@/pages/LabPage'
import ChatPage from '@/pages/ChatPage'
import PemilihanKonsep from '@/pages/PemilihanKonsep'
import Tujuan from '@/pages/TujuanPembelajaran'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-to-play" element={<HowToPlayPage />} />
      <Route path="/pemilihan" element={<PemilihanKonsep />} />
      <Route path="/tujuan" element={<Tujuan />} />
      <Route path="/lab" element={<LabPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}
