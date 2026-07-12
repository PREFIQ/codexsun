import { seedCompanyModule } from "./company/index.js";
export async function seedOrganisationModule() {
  await seedCompanyModule();
}
