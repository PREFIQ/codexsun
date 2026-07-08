import { useEffect } from "react";

type PageTitleProps = {
  title: string;
};

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    document.title = `${title} | CODEXSUN Core`;
  }, [title]);

  return null;
}
