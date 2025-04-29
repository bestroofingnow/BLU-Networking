import OpenAI from "openai";

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface NetworkingTipsRequest {
  fullName: string;
  industry: string;
  expertise: string;
  company: string;
  title: string;
  goal?: string;
  eventType?: string;
}

export interface NetworkingTip {
  category: string;  // "conversation_starter", "follow_up", "industry_specific", etc.
  tip: string;
  reasoning?: string;
}

export interface NetworkingTipsResponse {
  tips: NetworkingTip[];
  summary: string;
}

/**
 * Generate personalized networking tips based on user profile and goals
 */
export async function generateNetworkingTips(
  request: NetworkingTipsRequest
): Promise<NetworkingTipsResponse> {
  const prompt = `
As a professional networking coach, provide personalized networking tips for a business professional with the following profile:

- Name: ${request.fullName}
- Industry: ${request.industry || "Not specified"}
- Expertise/Skills: ${request.expertise || "Not specified"}
- Company: ${request.company || "Not specified"}
- Job Title: ${request.title || "Not specified"}
${request.goal ? `- Current networking goal: ${request.goal}` : ""}
${request.eventType ? `- Upcoming event type: ${request.eventType}` : ""}

Create a set of actionable networking tips tailored to this specific professional based on their industry, expertise, and goals. Include:
1. At least 3 personalized conversation starters that would work well for their background
2. Industry-specific networking advice
3. Follow-up strategies appropriate for their role
4. A brief summary of the key networking focus areas for this professional

Respond with JSON in this format:
{
  "tips": [
    {
      "category": "conversation_starter",
      "tip": "The conversation starter text",
      "reasoning": "Brief explanation of why this works for their background"
    },
    // More tips...
  ],
  "summary": "A concise 1-2 sentence summary of key networking focus areas"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert networking coach for business professionals who provides actionable, tailored networking advice.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(content) as NetworkingTipsResponse;
  } catch (error) {
    console.error("Error generating networking tips:", error);
    throw error;
  }
}