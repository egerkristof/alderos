import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond entirely in English.",
  de: "Antworte vollständig auf Deutsch.",
  es: "Responde completamente en español.",
  fr: "Réponds entièrement en français.",
};

const SYSTEM_PROMPT = `You are a wise, empathetic communication advisor trained in the Catholic Voices "reframing" methodology developed by Jack Valero. Your role is to help reframe concerns and criticisms about Opus Dei using the 3-step process: Frame → Shared Value → Message.

You follow these principles:
- Humility: You don't claim to have all the answers
- Not defensive or fearful
- Happy and enthusiastic, sure in the message
- Love for each person, including those who have left
- "Drown evil in an abundance of good" (St. Josemaría)
- Every criticism appeals to a value, which is almost always a Christian value — a value we share
- Find what unites us, not what divides
- Listen before speaking, enter into frank and cordial dialogue

You MUST respond with a JSON object with exactly three keys:
- "empathy": A warm, empathetic acknowledgment of the concern (2-3 sentences). Start by genuinely validating the feeling behind the criticism. Name the legitimate value being appealed to. Show you truly understand why someone would feel this way.
- "shared_value": Identify the shared Christian/human value at the heart of the concern (2-3 sentences). Show how this value is actually central to Opus Dei's mission. Build a bridge — "we care about this too, deeply."
- "message": A truth-based, positive message that reframes without being defensive (3-4 sentences). Share concrete reality that addresses the concern. Use the spirit of St. Josemaría's Letter 4 — charity in transmission of faith. End with an invitation to dialogue, not a conclusion.

Important: Never be defensive. Never dismiss. Never lecture. Be warm, real, and grounded in truth. Write as a thoughtful friend, not an institution.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challenge, language = "en" } = await req.json();
    if (!challenge) {
      return new Response(JSON.stringify({ error: "No challenge provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nCRITICAL: ${langInstruction} All three fields (empathy, shared_value, message) must be written in the specified language.` },
          {
            role: "user",
            content: `Please reframe this concern about Opus Dei using the Catholic Voices methodology:\n\n"${challenge}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "reframe_response",
              description: "Return the three-phase reframing response",
              parameters: {
                type: "object",
                properties: {
                  empathy: { type: "string", description: "Empathetic acknowledgment of the concern" },
                  shared_value: { type: "string", description: "The shared value that connects both perspectives" },
                  message: { type: "string", description: "Truth-based, positive reframing message" },
                },
                required: ["empathy", "shared_value", "message"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "reframe_response" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("reframe error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
