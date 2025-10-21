import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  pipeline: z.object({
    id: z.number(),
    name: z.string(),
    pressure_bar: z.number(),
    flow_m3h: z.number(),
    leakProb: z.number(),
  }),
  question: z.string().min(3),
  previousDiagnosis: z.object({
    summary: z.string(),
    recommendations: z.array(z.string()),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    const { pipeline, question, previousDiagnosis } = validatedData;

    const systemPrompt = `You are a senior pipeline reliability engineer answering follow-up questions about a specific pipeline. 
    
Pipeline Details:
- Name: ${pipeline.name}
- Pressure: ${pipeline.pressure_bar} bar
- Flow Rate: ${pipeline.flow_m3h} m³/h
- Leak Probability: ${(pipeline.leakProb * 100).toFixed(1)}%

${previousDiagnosis ? `Previous Diagnosis: ${previousDiagnosis.summary}` : ''}

Provide a clear, concise answer to the user's question. Be technical but understandable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "Unable to generate answer.";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Follow-up API Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process question" },
      { status: 500 }
    );
  }
}
