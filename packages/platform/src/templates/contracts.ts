export type TemplateStatus = "active" | "draft" | "archived";

export type PrintTemplate = {
  templateKey: string;
  moduleKey: string;
  documentType: string;
  label: string;
  version: string;
  status: TemplateStatus;
  defaultForTenant?: string;
  content?: string;
  updatedBy: string;
  updatedAt: string;
};
