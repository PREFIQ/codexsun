import { BadgeCheck, Building2, Crown, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { b2bConnectFallbackProfile } from "../../config/deployment";
import { B2bConnectAuthenticationForm } from "./authentication.form";
import { validateB2bConnectLogin } from "./authentication.schema";
import { clearB2bConnectRoleToken, loginB2bConnect } from "./authentication.services";
import type {
  B2bConnectLoginErrors,
  B2bConnectLoginValues,
  B2bConnectRole
} from "./authentication.types";
import "./authentication.css";

const roleContent: Record<
  B2bConnectRole,
  { description: string; destination: string; eyebrow: string; title: string }
> = {
  admin: {
    description: "Review marketplace members, moderate activity, and support business connections.",
    destination: "/admin",
    eyebrow: "OPERATIONS ACCESS",
    title: "Administrator desk"
  },
  client: {
    description:
      "Access your business profile, discover marketplace opportunities, and manage enquiries.",
    destination: "/app",
    eyebrow: "BUSINESS ACCESS",
    title: "Client portal"
  },
  super_admin: {
    description:
      "Control deployment access, governance, and platform health for this B2B marketplace.",
    destination: "/sa",
    eyebrow: "PLATFORM ACCESS",
    title: "Super administrator"
  }
};

export function B2bConnectAuthenticationWorkspace({ role }: { role: B2bConnectRole }) {
  const content = roleContent[role];
  const [values, setValues] = useState<B2bConnectLoginValues>({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<B2bConnectLoginErrors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearB2bConnectRoleToken(role);
    document.title = `${content.title} | ${b2bConnectFallbackProfile.brandName}`;
  }, [content.title, role]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateB2bConnectLogin(values);
    setErrors(validationErrors);
    setMessage("");
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await loginB2bConnect(role, values);
      window.location.assign(content.destination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const Icon = role === "super_admin" ? Crown : role === "admin" ? ShieldCheck : Building2;
  return (
    <main className={`b2b-auth-page b2b-auth-page-${role}`}>
      <a className="b2b-auth-brand" href="/">
        <span>{b2bConnectFallbackProfile.fallback}</span>
        {b2bConnectFallbackProfile.brandName}
      </a>
      <section className="b2b-auth-shell">
        <div className="b2b-auth-story">
          <div className="b2b-auth-icon">
            <Icon size={29} />
          </div>
          <p>{content.eyebrow}</p>
          <h1>
            Connect securely.
            <br />
            <em>Work with confidence.</em>
          </h1>
          <div className="b2b-auth-proof">
            <BadgeCheck size={20} />
            <span>
              <strong>Role-protected workspace</strong>
              <small>Your session opens only the desk assigned to this account.</small>
            </span>
          </div>
        </div>
        <div className="b2b-auth-card">
          <div className="b2b-auth-card-heading">
            <span>{content.eyebrow}</span>
            <h2>{content.title}</h2>
            <p>{content.description}</p>
          </div>
          <B2bConnectAuthenticationForm
            errors={errors}
            loading={loading}
            message={message}
            onChange={(field, value) => {
              setValues((current) => ({ ...current, [field]: value }));
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
            onSubmit={submit}
            values={values}
          />
          <a className="b2b-auth-back" href="/">
            ← Return to public marketplace
          </a>
        </div>
      </section>
    </main>
  );
}
