import { AuthLayout, Button, Field } from "@codexsun/ui";
import { LogIn } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { type Desk, login } from "../api";

type LoginPageProps = {
  desk: Desk;
  title: string;
};

export function LoginPage({ desk, title }: LoginPageProps) {
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

    return "/tenant";
  }, [desk]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await login({
        desk,
        email,
        password,
        tenantCode: "test"
      });

      if (!result.success) {
        setMessage(result.error?.message ?? "Login failed");
        return;
      }

      window.location.href = targetPath;
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={title}>
      <form className="auth-form" onSubmit={submit}>
        <Field
          autoComplete="email"
          label="Email"
          name="email"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        <Field
          autoComplete="current-password"
          label="Password"
          name="password"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {desk === "tenant" ? <Field label="Tenant code" name="tenantCode" readOnly value="test" /> : null}
        {message ? <p className="form-error">{message}</p> : null}
        <Button disabled={loading} icon={<LogIn size={16} />} type="submit">
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
