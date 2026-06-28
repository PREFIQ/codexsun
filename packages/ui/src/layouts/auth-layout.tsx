import type { ReactNode } from "react";

import { Card } from "../components/card";

type AuthLayoutProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

export function AuthLayout({ children, description = "Sign in to continue.", title }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <Card description={description} title={title}>
        {children}
      </Card>
    </main>
  );
}
