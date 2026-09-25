"use client"

import { useState, useRef } from "react"
import { cn } from "../../lib/utils"
import { Send, Image, Mic, Square, Loader2 } from "lucide-react"

export interface MessageInputProps {
  onSend: (body: string, attachments?: { type: "image" | "voice"; url: string; duration?: number }[]) => void
  isPending?: boolean
  className?: string
  placeholder?: string
}

export function MessageInput({
  onSend,
  isPending,
  className,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [text, setText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleSubmit = () => {
    if (!text.trim() || isPending) return
    onSend(text.trim())
    setText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      onSend("", [{ type: "image", url }])
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        const duration = Math.round(blob.size / 16000)

        if (duration <= 15) {
          onSend("", [{ type: "voice", url, duration }])
        }

        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setIsRecording(true)

      setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop()
          setIsRecording(false)
        }
      }, 15000)
    } catch {
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className={cn("flex items-end gap-2 p-4 border-t border-white/10", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        title="Attach image"
      >
        <Image size={20} />
      </button>

      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="p-2 rounded-lg bg-red-500 text-white animate-pulse shrink-0"
          title="Stop recording"
        >
          <Square size={20} />
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Record voice note (max 15s)"
        >
          <Mic size={20} />
        </button>
      )}

      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.currentTarget
            target.style.height = "auto"
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!text.trim() || isPending}
        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        title="Send message"
      >
        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </div>
  )
}
