'use client'

import { useEffect, useRef, useState } from 'react'
import { usePageVisibility } from './use-page-visibility'

interface UseLoadingManagerProps {
  timeout?: number // Timeout en ms para limpiar loading automáticamente
}

export function useLoadingManager({ timeout = 10000 }: UseLoadingManagerProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isVisible } = usePageVisibility()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingStartTime = useRef<number | null>(null)

  // Función para iniciar loading
  const startLoading = () => {
    console.log('Starting loading...')
    setIsLoading(true)
    setError(null)
    loadingStartTime.current = Date.now()

    // Auto-cleanup después del timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      console.log('Loading timeout reached, cleaning up...')
      setIsLoading(false)
      setError('La carga está tomando más tiempo del esperado. Intenta refrescar la página.')
    }, timeout)
  }

  // Función para detener loading
  const stopLoading = () => {
    const loadTime = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0
    console.log(`Stopping loading after ${loadTime}ms`)
    
    setIsLoading(false)
    setError(null)
    loadingStartTime.current = null

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Función para establecer error
  const setLoadingError = (errorMessage: string) => {
    console.log(`Loading error: ${errorMessage}`)
    setIsLoading(false)
    setError(errorMessage)
    loadingStartTime.current = null

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Limpiar loading cuando la página vuelve a ser visible después de estar oculta
  useEffect(() => {
    if (isVisible && isLoading) {
      const loadTime = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0
      
      // Si ha estado cargando por más de 5 segundos cuando volvemos, limpiarlo
      if (loadTime > 5000) {
        console.log('Page became visible with stale loading state, cleaning up...')
        stopLoading()
      }
    }
  }, [isVisible, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    isPageVisible: isVisible
  }
}