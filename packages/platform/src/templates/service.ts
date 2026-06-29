import { AppError } from "@codexsun/framework/errors";
import type { PrintTemplate } from "./contracts.js";
import type { TemplateRepository } from "./repository.js";

export class TemplateService {
  constructor(private readonly repository: TemplateRepository) {}

  async listTemplates(moduleKey?: string, documentType?: string): Promise<PrintTemplate[]> {
    return this.repository.list(moduleKey, documentType);
  }

  async getTemplate(templateKey: string): Promise<PrintTemplate> {
    const template = await this.repository.getByKey(templateKey);
    if (!template) throw AppError.notFound("Template not found");
    return template;
  }
}
