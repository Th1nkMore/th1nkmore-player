"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminLoginScreenProps = {
  nextPath?: string;
};

export function AdminLoginScreen({
  nextPath = "/admin",
}: AdminLoginScreenProps) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/admin";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrorMessage(data.error || "Login failed");
        return;
      }

      window.location.href = safeNextPath;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign in",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061015] px-6 py-10 text-[#d7ffe2]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.08),transparent_20%),linear-gradient(180deg,#071015_0%,#03070a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(100,255,160,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(100,255,160,0.05)_1px,transparent_1px)] [background-size:100%_28px,28px_100%]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(34,197,94,0.08),transparent)]" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[#08131a]/90 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-emerald-500/15 bg-[#0b171f] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-emerald-300/60">
          <span>Secure Console</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
            <span>Owner Session Gate</span>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="relative border-b border-emerald-500/15 p-8 lg:border-b-0 lg:border-r">
            <div className="mb-8 space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-emerald-300/55">
                Root Access
              </p>
              <h1 className="max-w-xl font-mono text-4xl font-semibold leading-tight text-[#ecfff2]">
                `sudo sonic-admin --session owner`
              </h1>
              <p className="max-w-xl text-sm leading-7 text-emerald-50/62">
                Private control surface for uploads, recordings, and playlist
                edits. Access stays cookie-bound after server-side validation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/45">
                  Session TTL
                </p>
                <p className="mt-3 font-mono text-xl text-emerald-100">7D</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/45">
                  Transport
                </p>
                <p className="mt-3 font-mono text-xl text-cyan-200">HTTPOnly</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/45">
                  Mode
                </p>
                <p className="mt-3 font-mono text-xl text-emerald-100">
                  Single Owner
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-emerald-500/15 bg-black/30 p-5 font-mono text-xs leading-6 text-emerald-100/75">
              <div className="mb-3 flex items-center gap-2 text-emerald-300/60">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                <span>boot.log</span>
              </div>
              <p>{"> owner-route armed"}</p>
              <p>{"> query-token login disabled"}</p>
              <p>{"> session cookie mode = strict"}</p>
              <p>{"> hidden status node can wake login portal"}</p>
            </div>
          </section>

          <section className="relative p-8">
            <div className="rounded-[24px] border border-emerald-500/20 bg-[#071118] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-6 flex items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.36em] text-emerald-300/50">
                    Authenticate
                  </p>
                  <h2 className="mt-3 font-mono text-2xl font-semibold text-white">
                    Unlock Admin Surface
                  </h2>
                </div>
                <div className="rounded-full border border-emerald-400/25 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/60">
                  local gate
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-300/48"
                    htmlFor="password"
                  >
                    Admin Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-emerald-500/20 bg-emerald-500/[0.03] px-4 font-mono text-sm text-white placeholder:text-emerald-100/24"
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>

                {errorMessage ? (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-100">
                    {`[auth:error] ${errorMessage}`}
                  </p>
                ) : (
                  <p className="rounded-2xl border border-emerald-500/12 bg-emerald-500/[0.04] px-4 py-3 font-mono text-xs leading-6 text-emerald-100/60">
                    Session will redirect to{" "}
                    <span className="text-emerald-200">{safeNextPath}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl border border-emerald-300/20 bg-emerald-300 text-[#021109] shadow-[0_0_24px_rgba(110,231,183,0.18)] hover:bg-emerald-200"
                  disabled={isSubmitting}
                >
                  <span className="font-mono uppercase tracking-[0.28em]">
                    {isSubmitting ? "Booting Session" : "Grant Access"}
                  </span>
                </Button>
              </form>

              <div className="mt-6 border-t border-emerald-500/12 pt-5 font-mono text-[11px] leading-6 text-emerald-100/44">
                <p>{"> hidden entry: tap status node five times"}</p>
                <p>{"> fallback path: /admin/login"}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
