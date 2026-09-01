"use client";

export interface ChatFile {
  name: string;
  type: string;
  size: number;
  url: string;
}

export function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatFileView({ file, mine }: { file: ChatFile; mine: boolean }) {
  if (file.type.startsWith("image/")) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.name}
          className="max-h-72 rounded-lg object-cover"
        />
      </a>
    );
  }

  if (file.type.startsWith("video/")) {
    return (
      <video
        src={file.url}
        controls
        preload="metadata"
        className="max-h-72 w-full rounded-lg bg-black"
      />
    );
  }

  if (file.type.startsWith("audio/")) {
    return (
      <div className="min-w-[220px]">
        <div className="mb-1 truncate text-xs opacity-80">{file.name}</div>
        <audio src={file.url} controls preload="metadata" className="w-full" />
      </div>
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        mine ? "bg-white/15" : "bg-white/10"
      }`}
    >
      <span className="text-lg">📎</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{file.name}</span>
        <span className="block text-xs opacity-70">
          {humanSize(file.size)} · yuklab olish
        </span>
      </span>
    </a>
  );
}
