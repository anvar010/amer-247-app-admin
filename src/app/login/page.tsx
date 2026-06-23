"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen"
      style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", background: "#EEF1F7" }}
    >
      {/* ── Brand panel (left) ── */}
      <div
        className="relative flex flex-col overflow-hidden p-[56px_60px] text-white"
        style={{
          background: "radial-gradient(130% 110% at 15% -10%, #7A1508 0%, #4A1808 55%, #1A0A05 100%)",
        }}
      >
        {/* Gold glow */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: -160, right: -140, width: 560, height: 560, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,162,75,0.16), transparent 65%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            opacity: 0.5,
            maskImage: "linear-gradient(160deg, #000, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[13px] text-[19px] font-extrabold"
            style={{
              background: "linear-gradient(155deg, #E3C77E, #A6822F)",
              color: "#2a1f00",
              boxShadow: "0 12px 26px rgba(201,162,75,0.34)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            A
          </div>
          <div>
            <p className="text-[20px] font-extrabold leading-[1.1] tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              AMER 24/7
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">Admin Console</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 mt-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "#E3C77E" }}>
            Government Services Platform
          </p>
          <h1
            className="my-4 text-[46px] font-extrabold leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Manage services.<br />
            <span style={{ color: "#E3C77E" }}>Serve faster.</span>
          </h1>
          <p className="max-w-[30ch] text-[16px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.78)" }}>
            Process applications, verify documents, and track every step — all in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-[38px] flex gap-[30px]">
          {[["24/7", "Service uptime"], ["UAE", "Government certified"], ["100%", "Secure & encrypted"]].map(([v, l]) => (
            <div key={l}>
              <b
                className="block text-[26px] font-extrabold leading-none"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {v}
              </b>
              <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.62)" }}>{l}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 mt-[34px] text-[12.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          © {new Date().getFullYear()} AMER 24/7. All rights reserved.
        </p>
      </div>

      {/* ── Form panel (right) ── */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[400px]">
          <h2
            className="text-[28px] font-extrabold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Sign in to console
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted">Enter your admin credentials to continue.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">
                Email address
              </label>
              <div className="relative flex items-center">
                <svg
                  className="pointer-events-none absolute left-[14px] text-muted-2"
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amer247.ae"
                  className="h-[50px] w-full rounded-[13px] border border-line bg-surface pl-[44px] pr-[14px] text-[14.5px] text-ink outline-none transition-shadow focus:border-amer-400"
                  style={{ fontFamily: "inherit" }}
                  onFocus={(e) => { e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                  onBlur={(e) => { e.target.style.boxShadow = ""; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">
                Password
              </label>
              <div className="relative flex items-center">
                <svg
                  className="pointer-events-none absolute left-[14px] text-muted-2"
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-[50px] w-full rounded-[13px] border border-line bg-surface pl-[44px] pr-[44px] text-[14.5px] text-ink outline-none transition-shadow focus:border-amer-400"
                  style={{ fontFamily: "inherit" }}
                  onFocus={(e) => { e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                  onBlur={(e) => { e.target.style.boxShadow = ""; }}
                />
                <button
                  type="button"
                  className="absolute right-3 flex items-center text-muted-2 hover:text-muted"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-[11px] bg-[#FBE9E7] px-3 py-2 text-[13.5px] font-medium text-[#B53224]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] text-[14.5px] font-semibold text-white transition disabled:opacity-60"
              style={{
                background: "#FF512F",
                boxShadow: "0 14px 30px rgba(255,81,47,0.30)",
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#E24020"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FF512F"; }}
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
