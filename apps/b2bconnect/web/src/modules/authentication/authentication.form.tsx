import { Button, Field } from "@codexsun/ui";
import { ArrowRight, Building2, LockKeyhole, Mail } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import type { B2bConnectLoginErrors, B2bConnectLoginValues } from "./authentication.types";

type B2bConnectAuthenticationFormProps = {
  errors: B2bConnectLoginErrors;
  loading: boolean;
  message: string;
  onChange: (field: keyof B2bConnectLoginValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: B2bConnectLoginValues;
};

export function B2bConnectAuthenticationForm({
  errors,
  loading,
  message,
  onChange,
  onSubmit,
  values
}: B2bConnectAuthenticationFormProps) {
  const change = (field: keyof B2bConnectLoginValues) => (event: ChangeEvent<HTMLInputElement>) =>
    onChange(field, event.target.value);

  return (
    <form className="b2b-auth-form" noValidate onSubmit={onSubmit}>
      <div>
        <Field
          autoComplete="email"
          disabled={loading}
          label="Email"
          name="email"
          onChange={change("email")}
          type="email"
          value={values.email}
        />
        {errors.email ? <small className="b2b-auth-field-error">{errors.email}</small> : null}
      </div>
      <div>
        <Field
          autoComplete="current-password"
          disabled={loading}
          label="Password"
          name="password"
          onChange={change("password")}
          type="password"
          value={values.password}
        />
        {errors.password ? <small className="b2b-auth-field-error">{errors.password}</small> : null}
      </div>
      {message ? (
        <div className="b2b-auth-error" role="alert">
          {message}
        </div>
      ) : null}
      <Button disabled={loading} type="submit">
        {loading ? "Signing in…" : "Sign in to desk"} <ArrowRight size={16} />
      </Button>
      <div className="b2b-auth-assurance">
        <span>
          <Building2 size={14} /> Workspace-aware
        </span>
        <span>
          <Mail size={14} /> Verified account
        </span>
        <span>
          <LockKeyhole size={14} /> Protected session
        </span>
      </div>
    </form>
  );
}
