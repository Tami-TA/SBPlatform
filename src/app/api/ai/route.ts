import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, context } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    let prompt = "";

    switch (type) {
      case "related_verses":
        prompt = `You are a knowledgeable Bible scholar assistant. Given this Bible verse or passage: "${context.verse}" from ${context.reference}, provide 3-5 related Bible verses that share similar themes, theological connections, or cross-references.

For each related verse, provide:
1. The verse reference (book, chapter:verse)
2. A brief explanation of how it connects (1-2 sentences)
3. The key shared theme

Format your response as a JSON array like this:
[
  {
    "reference": "Book Chapter:Verse",
    "bookId": "BOOK_ID",
    "chapter": 1,
    "verse": 1,
    "connection": "Brief explanation",
    "theme": "Key theme"
  }
]

Only return the JSON array, nothing else.`;
        break;

      case "reading_plan":
        prompt = `You are a thoughtful Bible study guide. Create a personalized 7-day reading plan for someone interested in: "${context.interests || "faith and spiritual growth"}".

Their current reading level: ${context.level || "beginner"}
Preferred style: ${context.style || "devotional"}

Create a structured 7-day reading plan with:
- Each day having 1-3 passages (not too overwhelming)
- A theme for each day
- A brief focus question for reflection

Format as JSON:
{
  "name": "Plan Name",
  "description": "Brief description",
  "theme": "Overall theme",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "passages": ["Book Chapter:Verse-Verse"],
      "reflection": "Brief reflection question"
    }
  ]
}

Only return the JSON, nothing else.`;
        break;

      case "verse_reflection":
        prompt = `You are a compassionate Bible study companion. Provide a brief but meaningful reflection (3-4 sentences) on this Bible verse:

"${context.verse}" — ${context.reference}

Focus on:
1. The immediate meaning and context
2. How it applies to daily modern life
3. An encouraging takeaway

Keep the tone warm, accessible, and faith-affirming. Do not use overly academic language. Return only the reflection text, no headers or formatting.`;
        break;

      case "prayer":
        prompt = `You are a prayer guide. Write a sincere, heartfelt prayer (3-4 sentences) inspired by this Bible verse: "${context.verse}" from ${context.reference}.

The prayer should:
- Reference the verse's message
- Be personal and conversational with God
- Include thanksgiving and petition
- Be suitable for someone in their daily devotional

Return only the prayer text, starting with "Heavenly Father" or "Lord" or similar. No headers or formatting.`;
        break;

      case "explain":
        prompt = `You are a clear and approachable Bible teacher. Explain this verse in simple, accessible language:

"${context.verse}" — ${context.reference}

Provide:
1. Historical/cultural context (1-2 sentences)
2. Plain language meaning (2-3 sentences)
3. Practical application for today (1-2 sentences)

Keep explanations concise and avoid overly technical terms. Format as plain text paragraphs, no headers.`;
        break;

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (type === "related_verses" || type === "reading_plan") {
      try {
        const parsed = JSON.parse(responseText);
        return NextResponse.json({ result: parsed });
      } catch {
        return NextResponse.json({ result: responseText });
      }
    }

    return NextResponse.json({ result: responseText });
  } catch (err) {
    console.error("AI API error:", err);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 503 }
    );
  }
}
