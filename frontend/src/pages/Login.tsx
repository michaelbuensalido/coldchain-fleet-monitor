import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import WelcomeShader from "../components/WelcomeShader";

interface LoginResponse {
  access_token: string;
}

async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(
    () => localStorage.getItem("rememberedEmail") ?? "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem("rememberedEmail"),
  );
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      navigate("/fleet");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  /* Shared input style factory */
  const inputStyle = (
    focused: boolean,
    hasError: boolean,
  ): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    fontFamily: "var(--font-display)",
    fontSize: 14,
    color: "var(--color-text-main)",
    background: "var(--color-paper-2)",
    border: `1px solid ${
      hasError
        ? "var(--color-status-offline-edge)"
        : focused
          ? "var(--color-accent-edge)"
          : "var(--color-border)"
    }`,
    borderRadius: 10,
    outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    boxShadow: focused
      ? `0 0 0 3px ${hasError ? "oklch(0.62 0.22 25 / 0.15)" : "var(--color-accent-glow)"}`
      : "none",
  });

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "var(--color-paper)",
        fontFamily: "var(--font-display)",
      }}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 960,
          borderRadius: 20,
          border: "1px solid var(--color-border)",
          background: "var(--color-paper-1)",
          boxShadow:
            "0 24px 64px oklch(0 0 0 / 0.65), 0 0 0 1px oklch(1 0 0 / 0.04)",
        }}
      >
        <div className="grid md:grid-cols-2" style={{ minHeight: 560 }}>
          {/* ── Left panel (brand) ──────────────────────────────── */}
          <div
            className="relative flex flex-col items-center justify-center overflow-hidden"
            style={{
              minHeight: 280,
              padding: "48px 40px",
              background: "var(--color-paper)",
              borderRight: "1px solid var(--color-border-quiet)",
            }}
          >
            <WelcomeShader />

            <div className="relative z-10 flex flex-col items-center gap-5 text-center">
              {/* Logo */}
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  border: "1px solid var(--color-accent-edge)",
                  background: "var(--color-paper-2)",
                  boxShadow:
                    "0 8px 24px oklch(0 0 0 / 0.50), 0 0 20px var(--color-accent-glow)",
                }}
              >
                <img
                  src="/logo.png"
                  alt="ColdChainIQ Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Wordmark */}
              <div className="space-y-1">
                <p
                  className="font-mono font-semibold uppercase tracking-[0.20em]"
                  style={{ fontSize: 10, color: "var(--color-accent)" }}
                >
                  Fleet Monitor
                </p>
                <h1
                  className="font-sans font-bold leading-tight"
                  style={{
                    fontSize: 30,
                    color: "var(--color-text-main)",
                    fontStyle: "normal",
                  }}
                >
                  ColdChainIQ
                </h1>
                <p
                  className="font-sans font-light leading-relaxed"
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-dim)",
                    maxWidth: 240,
                  }}
                >
                  Real-time cold-chain visibility across your entire fleet.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right panel (form) ──────────────────────────────── */}
          <div
            className="flex flex-col justify-center"
            style={{ padding: "48px 40px", background: "var(--color-paper-1)" }}
          >
            <div style={{ maxWidth: 340, width: "100%", margin: "0 auto" }}>
              {/* Form header */}
              <div className="mb-8 space-y-1">
                <h2
                  className="font-sans font-bold"
                  style={{
                    fontSize: 22,
                    color: "var(--color-text-main)",
                    fontStyle: "normal",
                  }}
                >
                  Welcome back
                </h2>
                <p
                  className="font-sans"
                  style={{ fontSize: 13, color: "var(--color-text-dim)" }}
                >
                  Sign in to access your fleet dashboard.
                </p>
              </div>

              {/* Error banner */}
              {loginMutation.isError && (
                <div
                  className="mb-5 flex items-center gap-2 font-sans text-sm"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "oklch(0.62 0.22 25 / 0.10)",
                    border: "1px solid var(--color-status-offline-edge)",
                    borderLeft: "3px solid var(--color-status-offline)",
                    color: "var(--color-status-offline)",
                  }}
                >
                  Invalid credentials — please try again.
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="font-sans font-medium"
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-dim)",
                      display: "block",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    style={inputStyle(emailFocus, loginMutation.isError)}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="font-sans font-medium"
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-dim)",
                      display: "block",
                    }}
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    style={inputStyle(passwordFocus, loginMutation.isError)}
                  />
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between">
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none font-sans"
                    style={{ fontSize: 13, color: "var(--color-text-dim)" }}
                  >
                    <input
                      type="checkbox"
                      id="login-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        width: 15,
                        height: 15,
                        accentColor: "var(--color-accent)",
                        // @ts-ignore
                        "--tw-ring-color": "var(--color-focus)",
                      }}
                    />
                    <span>Remember me</span>
                  </label>
                  <span
                    className="font-sans cursor-default"
                    style={{ fontSize: 13, color: "var(--color-accent)" }}
                  >
                    Forgot password?
                  </span>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full font-sans font-semibold cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                  style={{
                    padding: "12px",
                    fontSize: 14,
                    borderRadius: 10,
                    border: "1px solid var(--color-accent-edge)",
                    background: loginMutation.isPending
                      ? "var(--color-accent-dim)"
                      : "var(--color-accent)",
                    color: loginMutation.isPending
                      ? "var(--color-accent)"
                      : "oklch(0.10 0.018 240)",
                    boxShadow: loginMutation.isPending
                      ? "none"
                      : "0 4px 14px var(--color-accent-glow)",
                    // @ts-ignore
                    "--tw-ring-color": "var(--color-focus)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loginMutation.isPending) {
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 6px 20px var(--color-accent-glow)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "none";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      loginMutation.isPending
                        ? "none"
                        : "0 4px 14px var(--color-accent-glow)";
                  }}
                >
                  {loginMutation.isPending ? "Signing in…" : "Sign In"}
                </button>
              </form>

              {/* Footer */}
              <p
                className="mt-6 text-center font-sans"
                style={{ fontSize: 13, color: "var(--color-text-muted)" }}
              >
                Don&apos;t have an account?{" "}
                <span
                  className="cursor-default"
                  style={{ color: "var(--color-accent)" }}
                >
                  Contact your administrator
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
