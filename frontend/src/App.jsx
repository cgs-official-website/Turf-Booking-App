import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoard from "./pages/admin/DashBoard";
import TurfApprovals from './pages/admin/TurfApprovals'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashBoard />}/>
        <Route path="/TurfApprovals" element={<TurfApprovals />}/>
      </Routes>
    </BrowserRouter>
  
  )
}

export default App
