import type { PrintTemplate } from "./contracts.js";

export interface TemplateRepository {
  list(moduleKey?: string, documentType?: string): Promise<PrintTemplate[]>;
  getByKey(templateKey: string): Promise<PrintTemplate | null>;
  update(template: PrintTemplate): Promise<void>;
}

export class InMemoryTemplateRepository implements TemplateRepository {
  private templates: PrintTemplate[] = [
    {
      templateKey: "invoice_default", moduleKey: "billing", documentType: "invoice",
      label: "Default Invoice", version: "1.0", status: "active",
      defaultForTenant: "*", updatedBy: "system", updatedAt: new Date().toISOString()
    },
    {
      templateKey: "quote_default", moduleKey: "billing", documentType: "quote",
      label: "Default Quote", version: "1.0", status: "active",
      defaultForTenant: "*", updatedBy: "system", updatedAt: new Date().toISOString()
    },
    {
      templateKey: "receipt_default", moduleKey: "billing", documentType: "receipt",
      label: "Default Receipt", version: "1.0", status: "draft",
      updatedBy: "system", updatedAt: new Date().toISOString()
    }
  ];

  async list(moduleKey?: string, documentType?: string): Promise<PrintTemplate[]> {
    return this.templates.filter((t) => {
      if (moduleKey && t.moduleKey !== moduleKey) return false;
      if (documentType && t.documentType !== documentType) return false;
      return true;
    });
  }

  async getByKey(templateKey: string): Promise<PrintTemplate | null> {
    return this.templates.find((t) => t.templateKey === templateKey) || null;
  }

  async update(template: PrintTemplate): Promise<void> {
    const idx = this.templates.findIndex((t) => t.templateKey === template.templateKey);
    if (idx >= 0) this.templates[idx] = template;
    else this.templates.push(template);
  }
}
