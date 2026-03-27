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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challenge, userAnswers, aiAnswers, language = "en" } = await req.json();

    if (!challenge || !userAnswers || !aiAnswers) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    const systemPrompt = `You are a team of expert communication coaches specializing in the Catholic Voices reframing methodology. You bring together multiple perspectives:

1. **The Empathy Coach** - An expert in emotional intelligence and active listening. They assess whether the user truly acknowledged the feelings behind the concern or jumped to defending/explaining too quickly.

2. **The Bridge Builder** - A specialist in finding common ground across worldviews. They evaluate whether the shared value identified is genuinely shared (not just an Opus Dei value repackaged) and whether it creates a real bridge.

3. **The Message Architect** - A communications strategist who evaluates clarity, tone, and persuasiveness. They assess whether the message reframes positively or falls into common traps like defensiveness, whataboutism, or dismissiveness.

4. **The Root Cause Analyst** - A psychologist who looks at the deeper patterns in communication. They identify WHY certain weaknesses appear (e.g., fear of the question, over-identification with the institution, lack of genuine engagement with the concern).

Your task: Review the user's attempt at reframing a concern about Opus Dei, compare it against what an ideal response would look like, and provide rich, specific, constructive coaching.

Be honest but encouraging. Point out what they did well first, then what needs improvement, and always explain WHY something doesn't work, not just that it doesn't.

${langInstruction}`;

    const userPrompt = `The concern being addressed:
"${challenge}"

---

The user's attempt:

**Step 1 - Acknowledge the concern (empathy):**
${userAnswers.empathy || "(skipped)"}

**Step 2 - Find shared values:**
${userAnswers.shared_value || "(skipped)"}

**Step 3 - Craft a truth-based message:**
${userAnswers.message || "(skipped)"}

---

For reference, here is what an AI-generated ideal response looks like:

**Ideal empathy:** ${aiAnswers.empathy}
**Ideal shared value:** ${aiAnswers.shared_value}
**Ideal message:** ${aiAnswers.message}

---

Please provide your multi-expert coaching assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "coaching_feedback",
              description: "Structured coaching feedback on the user's reframing attempt",
              parameters: {
                type: "object",
                properties: {
                  overall_score: {
                    type: "number",
                    description: "Score from 1-10 on the overall quality of the reframing attempt",
                  },
                  overall_summary: {
                    type: "string",
                    description: "2-3 sentence summary of the overall impression, highlighting the biggest strength and area for growth",
                  },
                  empathy_feedback: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 1-10" },
                      strengths: { type: "string", description: "What the user did well in acknowledging the concern" },
                      improvements: { type: "string", description: "Specific ways to improve, with examples" },
                      root_cause: { type: "string", description: "Why the user may have struggled here (psychological/communication pattern insight)" },
                      ideal_example: { type: "string", description: "A polished version of what this step could look like" },
                    },
                    required: ["score", "strengths", "improvements", "root_cause", "ideal_example"],
                    additionalProperties: false,
                  },
                  shared_value_feedback: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 1-10" },
                      strengths: { type: "string", description: "What worked in identifying shared values" },
                      improvements: { type: "string", description: "How to find deeper, more authentic common ground" },
                      root_cause: { type: "string", description: "Why the user may have missed the mark (tendency to project vs. genuinely connect)" },
                      ideal_example: { type: "string", description: "A polished version of what this step could look like" },
                    },
                    required: ["score", "strengths", "improvements", "root_cause", "ideal_example"],
                    additionalProperties: false,
                  },
                  message_feedback: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 1-10" },
                      strengths: { type: "string", description: "What was effective in the final message" },
                      improvements: { type: "string", description: "How to make the message more compelling and less defensive" },
                      root_cause: { type: "string", description: "Deeper communication pattern analysis - why the message may fall flat" },
                      ideal_example: { type: "string", description: "A polished version of what this step could look like" },
                    },
                    required: ["score", "strengths", "improvements", "root_cause", "ideal_example"],
                    additionalProperties: false,
                  },
                  key_takeaway: {
                    type: "string",
                    description: "One powerful, memorable coaching insight the user should remember for next time",
                  },
                },
                required: ["overall_score", "overall_summary", "empathy_feedback", "shared_value_feedback", "message_feedback", "key_takeaway"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "coaching_feedback" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
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
    console.error("coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
