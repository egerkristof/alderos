import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = "kristof.eger@me.com";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const exists = existingUsers?.users?.find((u) => u.email === email);

    if (exists) {
      return new Response(
        JSON.stringify({ message: "Admin user already exists", id: exists.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: adminPassword,
      email_confirm: true,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Admin user created", id: data.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
