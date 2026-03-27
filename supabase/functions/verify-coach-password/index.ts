import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const COACH_PASSWORD = Deno.env.get("COACH_PASSWORD");
    if (!COACH_PASSWORD) {
      console.error("COACH_PASSWORD not configured");
      return new Response(JSON.stringify({ valid: false, error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valid = password === COACH_PASSWORD;
    return new Response(JSON.stringify({ valid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-coach-password error:", e);
    return new Response(
      JSON.stringify({ valid: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
