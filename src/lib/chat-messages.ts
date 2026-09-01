import type { Message } from "@prisma/client";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";

export interface ClientMessage {
  id: string;
  senderId: string;
  body: string;
  system: boolean;
  createdAt: number;
  mine: boolean;
  file: null | {
    name: string;
    type: string;
    size: number;
    url: string; // vaqtinchalik presigned GET
  };
}

/** DB message -> klientga yuboriladigan shakl (fayl bo'lsa presigned URL bilan). */
export async function toClientMessage(
  m: Message,
  meId: string,
): Promise<ClientMessage> {
  let file: ClientMessage["file"] = null;
  if (m.fileKey) {
    file = {
      name: m.fileName ?? "fayl",
      type: m.fileType ?? "application/octet-stream",
      size: m.fileSize ?? 0,
      url: await presignGet({ bucket: PRIVATE_BUCKET, key: m.fileKey, expiresIn: 3600 }),
    };
  }
  return {
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    system: m.system,
    createdAt: m.createdAt.getTime(),
    mine: m.senderId === meId,
    file,
  };
}

export function toClientMessages(list: Message[], meId: string) {
  return Promise.all(list.map((m) => toClientMessage(m, meId)));
}
