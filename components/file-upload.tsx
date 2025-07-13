"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FileData {
  url: string
  filename: string
  size: number
  type: string
}

interface FileUploadProps {
  value?: FileData | null
  onChange: (file: FileData | null) => void
  disabled?: boolean
  accept?: string
  maxSize?: number // in bytes
}

export function FileUpload({
  value,
  onChange,
  disabled = false,
  accept = "image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.xls",
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // Simulate upload progress
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
        throw new Error("Upload failed")
      }

      const result = await response.json()

      const fileData: FileData = {
        url: result.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      }

      onChange(fileData)

      toast({
        title: "File uploaded successfully",
        description: file.name,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = async () => {
    if (value?.url) {
      try {
        await fetch("/api/upload/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: value.url }),
        })
      } catch (error) {
        console.error("Delete error:", error)
      }
    }

    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
        <File className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{value.filename}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.open(value.url, "_blank")}
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center hover:border-muted-foreground/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">Drag and drop a file here, or click to select</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? "Uploading..." : "Select File"}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  )
}
