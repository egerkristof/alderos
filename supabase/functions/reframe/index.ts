import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  hu: "Valaszolj teljes egeszeben magyarul.",
};

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

    // Fetch the system prompt from the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: promptData } = await supabase
      .from("system_prompts")
      .select("prompt_text")
      .eq("name", "reframe")
      .single();

    const systemPrompt = promptData?.prompt_text || "You are a helpful assistant.";

    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: `${systemPrompt}\n\nCRITICAL: ${langInstruction} All three fields (empathy, shared_value, message) must be written in the specified language.\n\nIMPORTANT CITATION RULES:\n- You MUST embed inline citation markers like [1], [2], [3] etc. in the text of empathy, shared_value, and especially message fields.\n- Place citation markers at the end of sentences or claims that reference a source.\n- The numbers must correspond to the index (1-based) of the sources array.\n- Focus citations especially in the "message" field but include them in empathy and shared_value where relevant.\n- Provide 4-6 high-quality sources with real URLs where possible.\n- Sources should be real, verifiable references: Church documents, papal encyclicals, books by St. Josemaria Escriva, academic studies, official Opus Dei publications, Vatican documents, or reputable journalism.\n- For well-known documents, provide the actual URL (e.g. vatican.va links, opusdei.org links, or Google Books links).\n- If an exact URL is not available, set url to null.\n- Also suggest 3 related follow-up questions the user might want to explore next, in the specified language.` },
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
              description: "Return the three-phase reframing response with inline citations, sources, and follow-up questions",
              parameters: {
                type: "object",
                properties: {
                  empathy: { type: "string", description: "Empathetic acknowledgment with inline [N] citation markers where relevant" },
                  shared_value: { type: "string", description: "Shared value connecting perspectives with inline [N] citation markers where relevant" },
                  message: { type: "string", description: "Truth-based reframing message with inline [N] citation markers referencing sources" },
                  sources: {
                    type: "array",
                    description: "4-6 credible, real sources supporting the reframing",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Full title of the source (e.g. 'St. Josemaria Escriva, Christ Is Passing By, no. 48')" },
                        description: { type: "string", description: "One sentence explaining how this source supports the reframing" },
                        url: { type: "string", description: "Direct URL to the source if available (e.g. vatican.va, opusdei.org). Null if no reliable URL exists." },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                  follow_up_questions: {
                    type: "array",
                    description: "3 related follow-up questions the user might want to explore next",
                    items: { type: "string" },
                  },
                },
                required: ["empathy", "shared_value", "message", "sources", "follow_up_questions"],
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
