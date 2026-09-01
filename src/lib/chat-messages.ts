import type { Message } from "@prisma/client";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";

export interface ClientMessage {
  id: string;
  senderId: string;
  body: string;
  system: boolean;
  createdAt: number;
  updatedAt: number;
  mine: boolean;
  edited: boolean;
  deleted: boolean;
  file: null | {
    name: string;
    type: string;
    size: number;
    url: string; // vaqtinchalik presigned GET
  };
}

/**
 * DB message -> klientga yuboriladigan shakl (fayl bo'lsa presigned URL bilan).
 * forAdmin=true bo'lsa o'chirilgan xabar mazmuni ham qaytariladi.
 */
export async function toClientMessage(
  m: Message,
  meId: string,
  opts: { forAdmin?: boolean } = {},
): Promise<ClientMessage> {
  const deleted = !!m.deletedAt;
  const hideContent = deleted && !opts.forAdmin;

  let file: ClientMessage["file"] = null;
  if (!hideContent && m.fileKey) {
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
    body: hideContent ? "" : m.body,
    system: m.system,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
    mine: m.senderId === meId,
    edited: !!m.editedAt,
    deleted,
    file,
  };
}

export function toClientMessages(
  list: Message[],
  meId: string,
  opts: { forAdmin?: boolean } = {},
) {
  return Promise.all(list.map((m) => toClientMessage(m, meId, opts)));
}

/** SSE bus uchun (mine'siz). O'chirilgan xabar mazmunsiz. */
export async function toSerializedMessage(m: Message) {
  const deleted = !!m.deletedAt;
  let file = null as null | { name: string; type: string; size: number; url: string };
  if (!deleted && m.fileKey) {
    file = {
      name: m.fileName ?? "fayl",
      type: m.fileType ?? "application/octet-stream",
      size: m.fileSize ?? 0,
      url: await presignGet({ bucket: PRIVATE_BUCKET, key: m.fileKey, expiresIn: 3600 }),
    };
  }
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: deleted ? "" : m.body,
    system: m.system,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    edited: !!m.editedAt,
    deleted,
    file,
  };
}
