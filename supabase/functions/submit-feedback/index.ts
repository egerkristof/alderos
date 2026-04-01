import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_RATINGS = ["up", "down"];
const VALID_LANGUAGES = ["en", "de", "es", "fr", "it", "hu"];
const MAX_TEXT = 2000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { session_id, question, rating, feedback_text, language } = body;

    // Validate required fields
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rating || !VALID_RATINGS.includes(rating)) {
      return new Response(JSON.stringify({ error: "rating must be 'up' or 'down'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question.length > MAX_TEXT) {
      return new Response(JSON.stringify({ error: "question too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (feedback_text && (typeof feedback_text !== "string" || feedback_text.length > MAX_TEXT)) {
      return new Response(JSON.stringify({ error: "feedback_text too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (language && !VALID_LANGUAGES.includes(language)) {
      return new Response(JSON.stringify({ error: "invalid language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await sb.from("explore_feedback").insert({
      session_id: session_id || null,
      question: question.trim().slice(0, MAX_TEXT),
      rating,
      feedback_text: feedback_text ? feedback_text.trim().slice(0, MAX_TEXT) : null,
      language: language || "en",
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-feedback error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
