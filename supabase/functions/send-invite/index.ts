import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth API token verification handles ES256 correctly.
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: getUserError,
  } = await supabaseAdmin.auth.getUser(token);

  if (getUserError || !user) {
    console.error("[send-invite] auth.getUser failed:", getUserError?.message);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { organization_id, invitee_email, invited_by } = await req.json();

  const { data: member } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organization_id)
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("system_role")
    .eq("user_id", user.id)
    .single();

  if (!member || (member.role !== "admin" && profile?.system_role !== "dev")) {
    return new Response(
      JSON.stringify({ error: "Only admins can invite members" }),
      {
        status: 403,
        headers: corsHeaders,
      },
    );
  }

  const { data: invitation, error: insertError } = await supabaseAdmin
    .from("organization_invitations")
    .insert({
      organization_id,
      invitee_email: invitee_email.toLowerCase(),
      invited_by,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, token")
    .single();

  if (insertError || !invitation) {
    console.error("[send-invite] insert error:", insertError);
    return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name")
    .eq("organization_id", organization_id)
    .single();

  const orgName = org?.name ?? "the organization";
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
  const inviteLink = `${siteUrl}/invite/${invitation.token}`;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev",
        to: invitee_email,
        subject: `You're invited to join ${orgName}`,
        html: `
          <p>You have been invited to join <strong>${orgName}</strong>.</p>
          <p><a href="${inviteLink}">Click here to accept your invitation</a></p>
          <p>This invitation expires in 7 days.</p>
          <p>If you did not expect this, you can ignore this email.</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      console.error("[send-invite] Resend error:", emailRes.status, body);
      // Keep request successful because invite row already exists.
    }
  } else {
    console.log("[send-invite] No RESEND_API_KEY, invite link:", inviteLink);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
