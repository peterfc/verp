"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileData {
  url: string
  filename: string
  size: number
  type: string
}

interface FileUploadProps {
  value?: FileData | null
  onChange: (file: FileData | null) => void
  accept?: string
  maxSize?: number // in bytes
  disabled?: boolean
}

export function FileUpload({
  value,
  onChange,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()

      onChange({
        url: result.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      })

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.url }),
      })
    } catch (error) {
      console.error("Failed to delete file:", error)
    }

    onChange(null)
    toast({
      title: "File removed",
      description: "File has been removed successfully.",
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {!value ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled || uploading
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 hover:border-gray-400 cursor-pointer"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {uploading ? "Uploading..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">Max file size: {Math.round(maxSize / 1024 / 1024)}MB</p>

          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{value.filename}</p>
              <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={() => window.open(value.url, "_blank")}>
              View
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-gray-500 text-center">Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  )
}
