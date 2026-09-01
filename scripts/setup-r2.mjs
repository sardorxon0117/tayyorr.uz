/**
 * R2 bucketlarga CORS siyosatini o'rnatadi (brauzerdan to'g'ridan yuklash uchun).
 * Ishga tushirish:  node scripts/setup-r2.mjs
 */
import { readFileSync } from "fs";
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

// .env ni oddiy o'qish (dotenv shart emas)
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:3000,https://tayyorr.uz")
  .split(",")
  .map((s) => s.trim());

const CORSRules = [
  {
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedOrigins: allowedOrigins,
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

for (const bucket of [process.env.R2_BUCKET_PUBLIC, process.env.R2_BUCKET_PRIVATE]) {
  await client.send(
    new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules } }),
  );
  const check = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log(`✔ ${bucket} CORS o'rnatildi:`, JSON.stringify(check.CORSRules));
}
