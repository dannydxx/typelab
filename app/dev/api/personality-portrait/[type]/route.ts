import { NextResponse } from "next/server";
import { readPremiumPersonalityPortrait } from "@/lib/server/personality-portrait";

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });
  const { type } = await params;
  if (!/^(0[1-9]|1[0-6])$/.test(type)) return new NextResponse(null, { status: 404 });
  const portrait = await readPremiumPersonalityPortrait(type);
  if (!portrait) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(portrait), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
