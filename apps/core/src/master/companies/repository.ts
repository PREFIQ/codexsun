import type { CompanyProfile } from "./contracts.js";

export interface CompanyRepository {
  list(tenantId: string): Promise<CompanyProfile[]>;
  getById(tenantId: string, companyId: string): Promise<CompanyProfile | null>;
  create(company: CompanyProfile): Promise<void>;
  update(company: CompanyProfile): Promise<void>;
  archive(tenantId: string, companyId: string): Promise<void>;
  restore(tenantId: string, companyId: string): Promise<void>;
}

export class InMemoryCompanyRepository implements CompanyRepository {
  private companies: CompanyProfile[] = [];

  async list(tenantId: string): Promise<CompanyProfile[]> {
    return this.companies
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, companyId: string): Promise<CompanyProfile | null> {
    return this.companies.find((c) => c.companyId === companyId && c.tenantId === tenantId) ?? null;
  }

  async create(company: CompanyProfile): Promise<void> {
    this.companies.push(company);
  }

  async update(company: CompanyProfile): Promise<void> {
    const idx = this.companies.findIndex((c) => c.companyId === company.companyId && c.tenantId === company.tenantId);
    if (idx !== -1) this.companies[idx] = company;
  }

  async archive(tenantId: string, companyId: string): Promise<void> {
    const company = await this.getById(tenantId, companyId);
    if (company) {
      company.status = "archived";
      company.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, companyId: string): Promise<void> {
    const company = this.companies.find((c) => c.companyId === companyId && c.tenantId === tenantId);
    if (company) {
      company.status = "active";
      delete company.deletedAt;
    }
  }
}
