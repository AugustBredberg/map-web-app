import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { token, password, display_name } = body as {
      token: string;
      password: string;
      display_name?: string;
    };

    if (!token || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[accept-invite] Missing env vars", {
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey,
      });
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client bypasses RLS and can create confirmed users.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate the invitation token.
    const { data: inv, error: invError } = await admin
      .from("organization_invitations")
      .select("id, organization_id, invitee_email, expires_at")
      .eq("token", token)
      .is("accepted_at", null)
      .single();

    if (invError || !inv) {
      console.error("[accept-invite] Invitation lookup failed", invError);
      return new Response(
        JSON.stringify({ error: "Invitation not found or already used" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (inv.expires_at && new Date(inv.expires_at as string) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user with email_confirm: true; the invite link is proof.
    const { data: userData, error: createError } =
      await admin.auth.admin.createUser({
        email: inv.invitee_email as string,
        password,
        email_confirm: true,
      });

    if (createError) {
      console.error("[accept-invite] createUser failed", createError);
      const msg = createError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: createError.message,
            code: "account_exists",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const name = display_name?.trim() || (inv.invitee_email as string);

    const { error: memberError } = await admin.from("organization_members").insert({
      organization_id: inv.organization_id,
      user_id: userId,
      role: "member",
      display_name: name,
    });

    if (memberError && memberError.code !== "23505") {
      console.error("[accept-invite] insert member failed", memberError);
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consume invitation token.
    await admin.from("organization_invitations").delete().eq("id", inv.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[accept-invite] Unhandled exception", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
