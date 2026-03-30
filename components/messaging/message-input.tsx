"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";

interface Attachment {
  name: string;
  size: string;
  type: string;
}

interface MessageInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, attachments?: Attachment[]) => void;
}

export function MessageInput({ placeholder, value, onChange, onSend }: MessageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newAttachments = Array.from(files).map(f => ({
      name: f.name,
      size: formatSize(f.size),
      type: f.type.startsWith("image/") ? "image" : "document",
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!value.trim() && attachments.length === 0) return;
    onSend(value, attachments.length > 0 ? attachments : undefined);
    onChange("");
    setAttachments([]);
  };

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.04] backdrop-blur-sm">
          <div className="text-center">
            <FileText className="mx-auto size-6 text-primary/60" />
            <p className="mt-1 text-sm font-medium text-primary/80">Drop files to attach</p>
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2 py-1">
              {att.type === "image" ? <ImageIcon className="size-3 text-muted-foreground" /> : <FileText className="size-3 text-muted-foreground" />}
              <span className="text-[11px] font-medium max-w-[120px] truncate">{att.name}</span>
              <span className="text-[10px] text-muted-foreground">{att.size}</span>
              <button onClick={() => removeAttachment(i)} className="text-muted-foreground/50 hover:text-muted-foreground">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="Attach file"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        <input
          placeholder={placeholder || "Type a message..."}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
        />
        <Button size="icon" className="size-9 shrink-0" onClick={handleSend} disabled={!value.trim() && attachments.length === 0}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
