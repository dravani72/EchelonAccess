import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const BUSINESS_CARD_MODEL = process.env.OPENAI_BUSINESS_CARD_MODEL ?? "gpt-5.4-mini";

const cardSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    title: { type: ["string", "null"] },
    organization: { type: ["string", "null"] },
    emails: { type: "array", items: { type: "string" } },
    phones: { type: "array", items: { type: "string" } },
    website: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    cardDateHint: { type: ["string", "null"] },
    rawText: { type: "string" },
    confidence: { type: "number" },
    warnings: { type: "array", items: { type: "string" } }
  },
  required: ["name", "title", "organization", "emails", "phones", "website", "address", "cardDateHint", "rawText", "confidence", "warnings"]
};

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "A normalized card image is required." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return NextResponse.json({ error: "OCR accepts normalized JPEG, PNG, or WebP images only." }, { status: 415 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Normalized image is too large for low-cost OCR." }, { status: 413 });
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const imageUrl = `data:${image.type};base64,${imageBuffer.toString("base64")}`;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: BUSINESS_CARD_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Extract only visible business-card text and fields. Return null for missing fields. Keep rawText compact but complete. Do not infer unprinted facts."
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "low"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "business_card_ocr",
          strict: true,
          schema: cardSchema
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "Business card OCR failed.", detail: detail.slice(0, 500) }, { status: response.status });
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    return NextResponse.json({ error: "Business card OCR returned no structured text." }, { status: 502 });
  }

  try {
    return NextResponse.json(JSON.parse(outputText));
  } catch {
    return NextResponse.json({ error: "Business card OCR returned invalid structured JSON." }, { status: 502 });
  }
}

function extractOutputText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return "";
  const directText = (payload as { output_text?: unknown }).output_text;
  if (typeof directText === "string") return directText;

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => (typeof item === "object" && item !== null && Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : []))
    .map((content) => (typeof content === "object" && content !== null && typeof (content as { text?: unknown }).text === "string" ? (content as { text: string }).text : ""))
    .join("")
    .trim();
}
