'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent<boolean>) => {
      setIsCollapsed(event.detail)
    }

    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle)
    
    // Auto-collapse on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Hide sidebar margin on auth page and feed page (mobile-only pages)
  if (pathname === '/auth' || pathname === '/feed') {
    return <>{children}</>
  }

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out min-h-screen",
        "md:ml-64", // Default sidebar width
        isCollapsed && "md:ml-16" // Collapsed sidebar width
      )}
    >
      {children}
    </div>
  )
}