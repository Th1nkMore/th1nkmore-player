"use client";

import { ArrowLeft, AudioLines, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { AdminAppearanceControls } from "@/components/admin/AdminAppearanceControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_SESSION_TTL_SECONDS,
  getSafeAdminNextPath,
} from "@/lib/admin-auth-policy";

type AdminLoginScreenProps = {
  nextPath?: string;
};

export function AdminLoginScreen({
  nextPath = "/admin",
}: AdminLoginScreenProps) {
  const t = useTranslations("admin.login");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safeNextPath = getSafeAdminNextPath(nextPath);

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

      if (!response.ok) {
        setErrorMessage(
          t(
            response.status === 429
              ? "rateLimited"
              : response.status >= 500
                ? "unavailable"
                : "failed",
          ),
        );
        return;
      }

      window.location.href = safeNextPath;
    } catch {
      setErrorMessage(t("failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-y-auto overscroll-contain bg-[var(--editor-bg)] px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <a
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-[var(--admin-muted)]"
        >
          <ArrowLeft size={16} />
          {t("home")}
        </a>
        <div className="flex gap-2">
          <AdminAppearanceControls disabled={isSubmitting} />
        </div>
      </div>
      <div className="m-auto w-full max-w-[420px] py-10">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--admin-accent)] text-white">
            <AudioLines size={24} />
          </span>
          <span className="text-xl font-semibold tracking-tight">Sonic</span>
        </div>
        <div className="admin-panel rounded-3xl p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
            {t("description")}
          </p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="password">
                {t("password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  minLength={16}
                  maxLength={512}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "login-error" : undefined}
                  className="h-12 rounded-xl border-[var(--border)] bg-[var(--admin-inset)] pr-12"
                  required
                />
                <button
                  type="button"
                  aria-label={t(showPassword ? "hide" : "show")}
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg text-[var(--admin-muted)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <p
                id="login-error"
                role="alert"
                className="rounded-xl bg-rose-500/10 p-3 text-sm text-[var(--admin-danger)]"
              >
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              className="min-h-12 w-full rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {t(isSubmitting ? "submitting" : "submit")}
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-[var(--admin-subtle)]">
          {t("session", { hours: ADMIN_SESSION_TTL_SECONDS / 3600 })}
        </p>
      </div>
    </main>
  );
}
