import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_KINDS = ["contact", "positive", "negative"];
const VALID_LANGUAGES = ["en", "de", "es", "fr", "it", "hu", "pt", "pl"];
const MAX_MSG = 2000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;

const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= MAX_EMAIL;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, message, kind, language } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > MAX_MSG) {
      return new Response(JSON.stringify({ error: "message too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (name && (typeof name !== "string" || name.length > MAX_NAME)) {
      return new Response(JSON.stringify({ error: "invalid name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (email && (typeof email !== "string" || !isEmail(email))) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const k = kind && VALID_KINDS.includes(kind) ? kind : "contact";
    const lang = language && VALID_LANGUAGES.includes(language) ? language : "en";

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await sb.from("contact_messages").insert({
      name: name ? String(name).trim().slice(0, MAX_NAME) : null,
      email: email ? String(email).trim().slice(0, MAX_EMAIL) : null,
      message: String(message).trim().slice(0, MAX_MSG),
      kind: k,
      language: lang,
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
    console.error("submit-contact error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
