import type { ReactNode } from "react";

type WebLayoutProps = {
  children: ReactNode;
};

export function WebLayout({ children }: WebLayoutProps) {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <a className="public-brand" href="/">
          CODEXSUN
        </a>
        <div>
          <a href="/status">Status</a>
          <a href="/workspace">Workspace</a>
          <a href="/login">Tenant Login</a>
          <a href="/sa/login">Super Admin</a>
        </div>
      </nav>
      {children}
    </main>
  );
}
