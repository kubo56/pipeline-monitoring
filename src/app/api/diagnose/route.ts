import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

/**
 * Zod schema for validating diagnosis requests
 */
const DiagnosisRequestSchema = z.object({
  id: z.number(),
  name: z.string(),
  pressure_bar: z.number(),
  flow_m3h: z.number(),
  leakProb: z.number().min(0).max(1),
});

/**
 * POST /api/diagnose
 * 
 * Generates an AI-powered diagnosis for a pipeline using OpenAI GPT-4o-mini.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = DiagnosisRequestSchema.parse(body);

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env file." },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Construct the prompt
    const userPrompt = `
Analyze this pipeline:
- Name: ${validatedData.name}
- ID: ${validatedData.id}
- Pressure: ${validatedData.pressure_bar} bar
- Flow Rate: ${validatedData.flow_m3h} m³/h
- Calculated Leak Probability: ${(validatedData.leakProb * 100).toFixed(1)}%

Provide a concise diagnostic summary and 2-3 specific recommended actions.
    `.trim();

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a senior pipeline reliability engineer. Provide a concise diagnostic summary followed by 2-3 specific actionable recommendations. Format your response as: First, a brief summary paragraph. Then, list each recommendation starting with a number (1., 2., 3.). Do not use markdown formatting like ** or ##. Be direct and professional.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Clean up any markdown formatting
    let cleanedText = responseText
      .replace(/\*\*/g, '') // Remove ** markers
      .replace(/##/g, '')   // Remove ## headers
      .replace(/\*/g, '')   // Remove single * markers
      .trim();

    // Parse response into summary and recommendations
    const lines = cleanedText.split('\n').filter((line) => line.trim());
    
    // Find where recommendations start (look for numbered items)
    let summaryLines: string[] = [];
    const recommendations: string[] = [];
    let inRecommendations = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if line starts with a number (1., 2., 3., etc) or is a recommendation header
      if (trimmed.match(/^\d+\./) || trimmed.toLowerCase().includes('recommended action')) {
        inRecommendations = true;
        // If it's a numbered item, add to recommendations
        if (trimmed.match(/^\d+\./)) {
          const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
          if (cleaned.length > 10) {
            recommendations.push(cleaned);
          }
        }
      } else if (!inRecommendations && trimmed.length > 0) {
        summaryLines.push(trimmed);
      } else if (inRecommendations && !trimmed.match(/^\d+\./) && trimmed.length > 10) {
        // Multi-line recommendation
        if (recommendations.length > 0) {
          recommendations[recommendations.length - 1] += ' ' + trimmed;
        }
      }
    }

    // Build summary from collected lines
    let summary = summaryLines.join(' ').trim();
    if (!summary) {
      summary = "Analysis complete. The pipeline metrics have been evaluated.";
    }

    // Ensure we have at least 2 recommendations
    if (recommendations.length === 0) {
      recommendations.push("Conduct immediate inspection of pipeline joints, welds, and high-stress areas.");
      recommendations.push("Implement real-time monitoring systems to track pressure and flow anomalies.");
      recommendations.push("Schedule preventive maintenance and leak detection assessment within 48 hours.");
    } else if (recommendations.length === 1) {
      recommendations.push("Implement continuous monitoring and establish alert thresholds.");
      recommendations.push("Document current conditions and schedule follow-up inspection.");
    }

    return NextResponse.json({
      summary,
      recommendations: recommendations.slice(0, 3), // Max 3 recommendations
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to generate diagnosis", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
