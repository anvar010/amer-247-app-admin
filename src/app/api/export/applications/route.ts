import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const isSuperAdmin = profile?.role === "super_admin";

  let canExport = isSuperAdmin;
  if (!isSuperAdmin && profile?.role === "admin") {
    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("can_view_all_applications")
      .eq("user_id", user.id)
      .maybeSingle();
    canExport = !!(perms as { can_view_all_applications?: boolean } | null)?.can_view_all_applications;
  }
  if (!canExport) return new NextResponse("Forbidden", { status: 403 });

  // Read filters from query string
  const sp     = new URL(request.url).searchParams;
  const status = sp.get("status");
  const q      = sp.get("q")?.trim() ?? "";

  const admin = createAdminClient();

  let query = admin
    .from("applications")
    .select("id, ref, applicant_name, service_name, hub_title, fee, location, status, rejection_reason, created_at, user_id, group_ref")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status) as typeof query;
  if (q) query = query.or(
    `ref.ilike.%${q}%,service_name.ilike.%${q}%,applicant_name.ilike.%${q}%,hub_title.ilike.%${q}%`
  ) as typeof query;

  const { data: apps } = await query;

  // Deduplicate groups — keep only primary (ref === group_ref) or solo apps
  const rows = (apps || []).filter((a) => {
    const gr = (a as Record<string, unknown>).group_ref as string | null;
    return !gr || a.ref === gr;
  });

  // Fetch profiles for all user_ids in one shot
  const userIds = Array.from(new Set(rows.map((a) => a.user_id).filter(Boolean)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email, mobile, nationality").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; mobile: string | null; nationality: string | null }[] };
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Build CSV
  const HEADERS = [
    "Reference",
    "Applicant Name",
    "Email",
    "Mobile",
    "Nationality",
    "Service",
    "Hub",
    "Fee (AED)",
    "Location",
    "Status",
    "Rejection Reason",
    "Submitted Date",
  ];

  function cell(v: unknown): string {
    return `"${String(v ?? "").replace(/"/g, '""')}"`;
  }

  const dataRows = rows.map((a) => {
    const p = profileMap.get(a.user_id);
    return [
      a.ref,
      a.applicant_name || p?.full_name || "",
      p?.email || "",
      p?.mobile || "",
      p?.nationality || "",
      a.service_name || "",
      a.hub_title || "",
      a.fee ?? "",
      a.location || "",
      a.status || "",
      a.rejection_reason || "",
      new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    ].map(cell).join(",");
  });

  const csv = [HEADERS.map(cell).join(","), ...dataRows].join("\r\n");

  const datePart = new Date().toISOString().split("T")[0];
  const label    = status && status !== "all" ? `-${status}` : "";
  const filename = `applications${label}-${datePart}.csv`;

  return new NextResponse("﻿" + csv, {  // BOM for Excel UTF-8
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
