'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

export default function FloatingHomeButton() {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="relative">
        {/* Soft pulse ring */}
        <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" aria-hidden="true" />
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur shadow-lg ring-1 ring-black/5 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <Home className="h-6 w-6 text-blue-600 transition-colors duration-200 group-hover:text-blue-700" />
          <span className="sr-only">Inicio</span>
        </Link>
      </div>
    </div>
  )
}


