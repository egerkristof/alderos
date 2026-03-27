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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `${systemPrompt}\n\nCRITICAL: ${langInstruction} All three fields (empathy, shared_value, message) must be written in the specified language.` },
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
                  sources: {
                    type: "array",
                    description: "List of 2-4 credible sources that support the reframing (e.g. Church documents, papal writings, academic studies, official Opus Dei publications, reputable journalism). Each source should have a title and a brief description of its relevance.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Title or name of the source (e.g. 'Josemaria Escriva, Christ Is Passing By' or 'Vatican II, Lumen Gentium')" },
                        description: { type: "string", description: "One sentence explaining how this source supports the reframing" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["empathy", "shared_value", "message", "sources"],
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
