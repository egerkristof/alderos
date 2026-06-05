import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_EVENT_TYPES = ["preselected", "custom", "ai-generated", "withheld", "explore"];
const VALID_MODES = ["ai", "training", "explore"];
const VALID_LANGUAGES = ["en", "de", "es", "fr", "it", "hu", "pt"];
const MAX_TEXT = 2000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { event_type, challenge_id, challenge_text, language, mode, session_id } = body;

    // Validate
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return new Response(JSON.stringify({ error: "invalid event_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!challenge_text || typeof challenge_text !== "string") {
      return new Response(JSON.stringify({ error: "challenge_text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (challenge_text.length > MAX_TEXT) {
      return new Response(JSON.stringify({ error: "challenge_text too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode && !VALID_MODES.includes(mode)) {
      return new Response(JSON.stringify({ error: "invalid mode" }), {
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

    const { error } = await sb.from("usage_events").insert({
      event_type,
      challenge_id: challenge_id || null,
      challenge_text: challenge_text.trim().slice(0, MAX_TEXT),
      language: language || "en",
      mode: mode || null,
      session_id: session_id || null,
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
    console.error("log-event error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
