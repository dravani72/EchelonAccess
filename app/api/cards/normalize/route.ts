import { createRequire } from "node:module";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type HeicConvert = (options: { buffer: Buffer; format: "JPEG"; quality: number }) => Promise<ArrayBuffer | Buffer>;

const require = createRequire(import.meta.url);
const heicConvert = require("heic-convert") as HeicConvert;
const MAX_HEIC_BYTES = 16 * 1024 * 1024;
const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "A HEIC or HEIF card image is required." }, { status: 400 });
  }

  if (!isHeicImage(image)) {
    return NextResponse.json({ error: "Only HEIC or HEIF files need server normalization." }, { status: 415 });
  }

  if (image.size > MAX_HEIC_BYTES) {
    return NextResponse.json({ error: "HEIC image is too large to normalize. Export a smaller image and try again." }, { status: 413 });
  }

  try {
    const inputBuffer = Buffer.from(await image.arrayBuffer());
    const output = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.74
    });
    const outputBuffer = Buffer.from(output instanceof ArrayBuffer ? new Uint8Array(output) : output);

    return new NextResponse(outputBuffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${baseFileName(image.name)}-converted.jpg"`,
        "Content-Type": "image/jpeg"
      }
    });
  } catch {
    return NextResponse.json({ error: "Could not convert HEIC image. Export it as JPG or PNG and try again." }, { status: 422 });
  }
}

function isHeicImage(file: File) {
  const normalizedName = file.name.toLowerCase();
  return HEIC_TYPES.has(file.type.toLowerCase()) || normalizedName.endsWith(".heic") || normalizedName.endsWith(".heif");
}

function baseFileName(name: string) {
  return (name.replace(/\.[^.]+$/, "") || "business-card").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
