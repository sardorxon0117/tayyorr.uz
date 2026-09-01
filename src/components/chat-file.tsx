"use client";

export interface ChatFile {
  name: string;
  type: string;
  size: number;
  url: string;
}

function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatFileView({ file, mine }: { file: ChatFile; mine: boolean }) {
  const isImage = file.type.startsWith("image/");

  if (isImage) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.name}
          className="max-h-64 rounded-lg object-cover"
        />
      </a>
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
