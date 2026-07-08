import { AuthLayout, Button, Field } from "@codexsun/ui";
import { LogIn } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type Desk, login } from "../../shared/api/platform-api";

type LoginPageProps = {
  desk: Desk;
  title: string;
};

export function LoginPage({ desk, title }: LoginPageProps) {
  const navigate = useNavigate();
  const [corporateId, setCorporateId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const targetPath = useMemo(() => {
    if (desk === "sa") {
      return "/sa";
    }

    if (desk === "admin") {
      return "/admin";
    }

    return "/app";
  }, [desk]);

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
    <AuthLayout surface={desk} title={title}>
      <form className="auth-form" onSubmit={submit}>
        {desk === "tenant" ? (
          <Field
            autoComplete="organization"
            className="auth-field"
            label="Corporate ID"
            name="corporateId"
            disabled={loading}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setCorporateId(event.target.value)}
            value={corporateId}
          />
        ) : null}
        <Field
          autoComplete="email"
          className="auth-field"
          label="Email"
          name="email"
          disabled={loading}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        <Field
          autoComplete="current-password"
          className="auth-field"
          label="Password"
          name="password"
          disabled={loading}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {message ? <p className="form-error">{message}</p> : null}
        <Button disabled={loading} icon={<LogIn size={16} />} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
