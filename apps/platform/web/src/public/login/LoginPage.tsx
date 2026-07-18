import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { developmentTenantLogin, type Desk, login } from "../../shared/api/platform-api";
import "./login.css";

type LoginPageProps = {
  desk: Desk;
  title: string;
};

function CodexsunMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

export function LoginPage({ desk, title }: LoginPageProps) {
  const navigate = useNavigate();
  const [corporateId, setCorporateId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const autoLoginStarted = useRef(false);

  const targetPath = useMemo(() => {
    if (desk === "sa") return "/sa/$";
    if (desk === "admin") return "/admin";
    return "/app/$";
  }, [desk]);

  useEffect(() => {
    if (
      desk !== "tenant" ||
      !import.meta.env.DEV ||
      import.meta.env.VITE_DEV_AUTO_TENANT_LOGIN !== "1" ||
      autoLoginStarted.current
    ) {
      return;
    }

    autoLoginStarted.current = true;
    setLoading(true);
    setMessage("");
    void developmentTenantLogin()
      .then(async (result) => {
        if (!result.success) {
          setMessage(result.error.message);
          return;
        }
        await navigate({ to: targetPath });
      })
      .catch(() => setMessage("Development auto-login failed."))
      .finally(() => setLoading(false));
  }, [desk, navigate, targetPath]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await login({
        ...(desk === "tenant" ? { corporateId } : {}),
        desk,
        email,
        password
      });

      if (!result.success) {
        setMessage(result.error?.message ?? "Login failed");
        return;
      }

      await navigate({ to: targetPath });
    } catch {
      setMessage("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="codexsun-public-site public-login-page">
      <a href="/" className="public-login-home" aria-label="Back to CODEXSUN home">
        <CodexsunMark />
      </a>
      <section className="public-login-panel">
        <div className="public-login-heading">
          <span>CODEXSUN / Secure access</span>
          <h1 className="font-display">CODEXSUN</h1>
          <p>{title}</p>
        </div>

        <form onSubmit={submit} className="public-login-form" noValidate>
          {desk === "tenant" ? (
            <label>
              <span>Corporate ID</span>
              <input
                autoComplete="organization"
                disabled={loading}
                id="corporate-id"
                name="corporateId"
                onChange={(event) => setCorporateId(event.target.value)}
                placeholder="Your company ID"
                value={corporateId}
              />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              disabled={loading}
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              disabled={loading}
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </label>
          {message ? <p className="public-login-error">{message}</p> : null}
          <button disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="public-login-links">
          <a href="/login">Application</a>
          <a href="/admin/login">Admin</a>
          <a href="/sa/login">Super Admin</a>
        </div>
        <p className="public-login-note">Authorized CODEXSUN personnel and tenant users only.</p>
      </section>
    </main>
  );
}
