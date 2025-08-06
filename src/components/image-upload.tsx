'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  isProcessing?: boolean
  processingProgress?: number
  accept?: string
  maxSize?: number // in MB
  className?: string
  preview?: string | null
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  isProcessing = false,
  processingProgress = 0,
  accept = 'image/*',
  maxSize = 10,
  className,
  preview
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Solo se permiten archivos de imagen'
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo es muy grande. Máximo ${maxSize}MB`
    }
    
    return null
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onImageSelect(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {!isProcessing && (
              <button
                onClick={onImageRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Procesando OCR...</span>
                <span className="font-medium">{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={cn(
            'relative cursor-pointer border-2 border-dashed rounded-lg p-6 transition-colors',
            'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            dragActive && 'border-primary bg-primary/10',
            !dragActive && 'border-muted-foreground/25',
            isProcessing && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-muted rounded-full">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              ) : (
                <Upload size={24} className="text-muted-foreground" />
              )}
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                {isProcessing ? 'Procesando...' : 'Subir ticket de apuesta'}
              </p>
              <p className="text-xs text-muted-foreground">
                Arrastra una imagen aquí o haz click para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo {maxSize}MB • PNG, JPG, WEBP
              </p>
            </div>

            {isProcessing && (
              <div className="w-full max-w-xs">
                <Progress value={processingProgress} />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}