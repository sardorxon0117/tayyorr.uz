export type UploadKind = "AVATAR" | "ATTACHMENT" | "DELIVERABLE" | "CHAT";

export interface UploadResult {
  key: string;
  bucket: "public" | "private";
  publicUrl?: string;
}

/**
 * 1) backend'dan presigned URL oladi
 * 2) faylni to'g'ridan R2 ga PUT qiladi
 * 3) (ixtiyoriy) yozuvni bazaga qayd etadi
 */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  opts: { orderId?: string; conversationId?: string; register?: boolean } = {},
): Promise<UploadResult> {
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      orderId: opts.orderId,
      conversationId: opts.conversationId,
    }),
  });
  if (!presignRes.ok) {
    const { error } = await presignRes.json().catch(() => ({}));
    throw new Error(error || "Yuklashni boshlab bo'lmadi");
  }
  const { uploadUrl, key, bucket, publicUrl } = await presignRes.json();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Fayl R2 ga yuklanmadi");

  if (opts.register) {
    await fetch("/api/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        bucket,
        kind,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        orderId: opts.orderId,
      }),
    });
  }

  return { key, bucket, publicUrl };
}
