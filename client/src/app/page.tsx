"use client"

import Footer from '@/components/menubar/footer'
import Navbar from '@/components/menubar/navbar'
import React from 'react'

export default function HomePage() {
  return (
    <div id="homepage" className='min-h-screen bg-linear-to-t from-white to-[#f3e8bf]  bg-no-repeat max-h-200 antialiased'>
        <Navbar />
        <div className="container max-w-8xl mx-auto px-4 py-8">
            page
            </div>
            <Footer />
        </div>
  )
}
