import { EventEmitter } from "events";

/**
 * Jarayon ichidagi oddiy pub/sub — SSE stream'lariga yangi xabarni yetkazish uchun.
 * Bitta Node instansiyada real vaqt rejimi. Ko'p instansiyali (serverless) deploy'da
 * bu instansiyalararo tarqalmaydi — o'sha holатда klient 4 soniyalik polling bilan
 * baribir xabarni oladi (kechikish bilan). Keyinchalik Redis/Ably bilan almashtiriladi.
 */

type ChatEvent =
  | { type: "message"; message: SerializedMessage }
  | { type: "read"; by: string; at: string };

export interface SerializedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  system: boolean;
  createdAt: string;
  file: null | {
    name: string;
    type: string;
    size: number;
    url: string;
  };
}

const g = globalThis as unknown as { __chatBus?: EventEmitter };
export const chatBus = g.__chatBus ?? new EventEmitter();
chatBus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") g.__chatBus = chatBus;

export function publishToConversation(conversationId: string, event: ChatEvent) {
  chatBus.emit(`conv:${conversationId}`, event);
}
