export type B2bConnectRole = "super_admin" | "admin" | "client";

export type B2bConnectSession = {
  authenticated: true;
  email: string;
  expiresAt: string;
  name: string;
  role: B2bConnectRole;
  sessionIssuedAt: string;
};

export type B2bConnectLoginValues = {
  email: string;
  password: string;
};

export type B2bConnectLoginErrors = Partial<Record<keyof B2bConnectLoginValues, string>>;

export type B2bConnectSessionState =
  | { status: "checking"; session: null }
  | { status: "authenticated"; session: B2bConnectSession }
  | { status: "unauthenticated"; session: null };
