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
  it: "Rispondi interamente in italiano.",
  hu: "Válaszolj teljesen magyarul.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, language = "en", consent = true, session_id = null } = await req.json();
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No question provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    // Fetch prompt from database (fall back to default if not found)
    let promptText = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceKey);
      const { data } = await sb.from("system_prompts").select("prompt_text").eq("name", "explore").single();
      if (data?.prompt_text) promptText = data.prompt_text;
    } catch { /* use fallback */ }

    if (!promptText) {
      promptText = `You are Alderos, an expert on Opus Dei who provides clear, honest, and well-sourced answers to questions about Opus Dei.

Your role is to help people genuinely understand Opus Dei by providing truthful, balanced, and nuanced answers. You are not defensive or promotional. You acknowledge legitimate concerns honestly while providing accurate context and information.

Guidelines:
- Be direct and clear. Give a cohesive, well-structured answer.
- Acknowledge complexity and nuance. Avoid oversimplifying.
- When there are legitimate criticisms, acknowledge them honestly.
- Provide historical and theological context where helpful.
- Embed inline citation markers like [1], [2], [3] in your answer text.
- STRONGLY PREFER sources that have a real, working URL on the internet. Prioritize official websites (opusdei.org, vatican.va), reputable news outlets, academic repositories, and online archives. Only cite books or offline sources when no suitable online source exists for that point.
- Provide 3-5 credible sources. Every source MUST include a direct URL whenever possible.
- Suggest 3 related follow-up questions.
- NEVER use em dashes or en dashes. Use commas, periods, or colons instead.`;
    }

    const systemPrompt = `${promptText}\n\n${langInstruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "explore_response",
              description: "Return a direct, well-sourced answer with citations and follow-up questions",
              parameters: {
                type: "object",
                properties: {
                  answer: {
                    type: "string",
                    description: "A clear, direct, well-structured answer with inline [N] citation markers. Use paragraphs for readability. Do not use em dashes or en dashes.",
                  },
                  sources: {
                    type: "array",
                    description: "3-5 credible sources supporting the answer",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Full title of the source" },
                        description: { type: "string", description: "One sentence explaining relevance" },
                        url: { type: "string", description: "Direct URL if available, null otherwise" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                  follow_up_questions: {
                    type: "array",
                    description: "3 related follow-up questions the user might want to explore",
                    items: { type: "string" },
                  },
                },
                required: ["answer", "sources", "follow_up_questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "explore_response" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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

      // Validate source URLs in parallel
      if (parsed.sources && Array.isArray(parsed.sources)) {
        const validated = await Promise.all(
          parsed.sources.map(async (source: { title: string; description: string; url?: string | null }) => {
            if (!source.url) return source;
            try {
              const check = await fetch(source.url, {
                method: "HEAD",
                redirect: "follow",
                signal: AbortSignal.timeout(5000),
              });
              if (check.ok) return source;
              // Try GET as fallback (some servers reject HEAD)
              const getCheck = await fetch(source.url, {
                method: "GET",
                redirect: "follow",
                signal: AbortSignal.timeout(5000),
              });
              if (getCheck.ok) return source;
              console.log(`Removing broken URL (${check.status}): ${source.url}`);
              return { ...source, url: null };
            } catch (e) {
              console.log(`Removing unreachable URL: ${source.url}`, e);
              return { ...source, url: null };
            }
          })
        );
        parsed.sources = validated;
      }

      // Log the question to usage_events
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, serviceKey);
        await sb.from("usage_events").insert({
          event_type: consent ? "explore" : "withheld",
          challenge_text: consent ? question.trim() : "(withheld by user)",
          language,
          mode: "explore",
          session_id: session_id || null,
        });
      } catch (logErr) {
        console.error("Failed to log explore event:", logErr);
      }

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
    console.error("explore error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
