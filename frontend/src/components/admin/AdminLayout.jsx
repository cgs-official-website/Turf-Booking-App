import React from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function AdminLayout({ children }) {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
