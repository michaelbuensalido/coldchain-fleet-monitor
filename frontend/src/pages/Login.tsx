import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { API_BASE, storeAuthToken } from "../config";

interface LoginResponse {
  access_token?: string;
  token?: string;
}

async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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
      storeAuthToken(data as Record<string, string>);
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

  const inputStyle = (focused: boolean, hasError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    fontFamily: "var(--font-data)",
    fontSize: 13,
    color: "var(--color-text-main)",
    background: "var(--color-paper-2)",
    border: `1px solid ${
      hasError
        ? "var(--color-status-offline-edge)"
        : focused
          ? "var(--color-accent-edge)"
          : "var(--color-border)"
    }`,
    borderRadius: "var(--radius-md)",
    outline: "none",
    transition: "border-color 120ms ease",
    boxShadow: focused
      ? `0 0 0 3px ${hasError ? "oklch(0.62 0.21 25 / 0.12)" : "var(--color-accent-glow)"}`
      : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-paper)",
        fontFamily: "var(--font-display)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* Left — Brand / System identity ───────────────────────── */}
      <div
        style={{
          borderRight: "1px solid var(--color-border-quiet)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo.png"
            alt="ColdChainIQ"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              objectFit: "cover",
            }}
          />
          <div>
            <p
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 9,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                margin: 0,
              }}
            >
              Fleet Monitor
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-text-main)",
                margin: 0,
                fontStyle: "normal",
              }}
            >
              ColdChainIQ
            </h1>
          </div>
        </div>

        {/* Central statement — not a hero, just calibrated text */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 10,
              color: "var(--color-accent)",
              textTransform: "uppercase",
              letterSpacing: "0.20em",
              marginBottom: 16,
            }}
          >
            Real-time cold-chain visibility
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 600,
              color: "var(--color-text-main)",
              lineHeight: 1.2,
              fontStyle: "normal",
              maxWidth: 320,
            }}
          >
            Fleet intelligence for logistics operators
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              color: "var(--color-text-dim)",
              marginTop: 16,
              maxWidth: 340,
              lineHeight: 1.6,
            }}
          >
            Monitor temperature, status, and location across every truck in your fleet — in one view.
          </p>

          {/* Stat row — real numbers only */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1,
              marginTop: 40,
              background: "var(--color-border-quiet)",
              border: "1px solid var(--color-border-quiet)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {[
              { value: "20",  label: "Active Trucks" },
              { value: "10s", label: "Heartbeat Interval" },
              { value: "24h", label: "Data Retention" },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{
                  background: "var(--color-paper-1)",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--color-text-main)",
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 9,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer label */}
        <p
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 10,
            color: "var(--color-text-muted)",
          }}
        >
          Cold-chain logistics management system
        </p>
      </div>

      {/* Right — Login form ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 56px",
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 9,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginBottom: 8,
            }}
          >
            Operator sign-in
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-text-main)",
              fontStyle: "normal",
              margin: 0,
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              color: "var(--color-text-dim)",
              marginTop: 6,
            }}
          >
            Sign in to access your fleet dashboard.
          </p>
        </div>

        {/* Error banner */}
        {loginMutation.isError && (
          <div
            style={{
              marginBottom: 20,
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-status-offline-dim)",
              border: "1px solid var(--color-status-offline-edge)",
              color: "var(--color-status-offline)",
              fontFamily: "var(--font-data)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>✕</span>
            Invalid credentials — please try again.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="login-email"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@coldchain.com"
              required
              autoComplete="email"
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              style={inputStyle(emailFocus, !!loginMutation.isError)}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="login-password"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              style={inputStyle(passwordFocus, !!loginMutation.isError)}
            />
          </div>

          {/* Remember me */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="login-remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: 13,
                height: 13,
                accentColor: "var(--color-accent)",
              }}
            />
            <label
              htmlFor="login-remember"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                color: "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              Remember this device
            </label>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loginMutation.isPending}
            style={{
              marginTop: 8,
              padding: "10px 16px",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-accent-edge)",
              background: loginMutation.isPending
                ? "var(--color-accent-dim)"
                : "var(--color-accent)",
              color: loginMutation.isPending
                ? "var(--color-accent)"
                : "oklch(0.08 0.010 255)",
              cursor: loginMutation.isPending ? "wait" : "pointer",
              transition: "background 120ms ease, box-shadow 120ms ease",
              boxShadow: loginMutation.isPending ? "none" : "0 2px 12px var(--color-accent-glow)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!loginMutation.isPending) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loginMutation.isPending) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
              }
            }}
          >
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-paper-2)",
            border: "1px solid var(--color-border-quiet)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--color-text-dim)" }}>
            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>Default Admin:</span> admin@coldchain.com / adminpassword
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@coldchain.com");
              setPassword("adminpassword");
            }}
            style={{
              padding: "4px 8px",
              fontFamily: "var(--font-data)",
              fontSize: 10,
              color: "var(--color-accent)",
              background: "var(--color-accent-dim)",
              border: "1px solid var(--color-accent-edge)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Auto-fill
          </button>
        </div>

        <p
          style={{
            marginTop: 20,
            fontFamily: "var(--font-data)",
            fontSize: 11,
            color: "var(--color-text-muted)",
          }}
        >
          No account?{" "}
          <span style={{ color: "var(--color-accent)" }}>
            Contact your administrator
          </span>
        </p>
      </div>
    </div>
  );
}
