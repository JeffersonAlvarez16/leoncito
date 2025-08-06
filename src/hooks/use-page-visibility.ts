'use client'

import { useEffect, useState } from 'react'

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsHidden(hidden)
      setIsVisible(!hidden)

      // Log para debugging
      console.log(`Page visibility changed: ${hidden ? 'hidden' : 'visible'}`)
    }

    // Set initial state
    if (typeof document !== 'undefined') {
      setIsHidden(document.hidden)
      setIsVisible(!document.hidden)
    }

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return {
    isVisible,
    isHidden
  }
}