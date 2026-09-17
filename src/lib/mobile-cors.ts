import { NextResponse } from "next/server";

/**
 * Mobil API uchun CORS. Asl (native) ilovaga umuman kerak emas — brauzer
 * emas — lekin Flutter web build/test paytida va kelajakdagi boshqa
 * mijozlar uchun zarar qilmaydi, shuning uchun ochiq qoldiramiz.
 */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/** NextResponse.json o'rniga — natijaga avtomatik CORS header qo'shadi. */
export function mobileJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: corsHeaders() });
}

/** Har bir mobil route faylida shuni eksport qiling: preflight so'rovi uchun. */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
