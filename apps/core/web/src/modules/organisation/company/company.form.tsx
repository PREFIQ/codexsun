import { MasterWorkspaceShell } from "../../master/master.workspace";
import { companyDefinition } from "./company.definition";

export function CompanyForm() {
  return <MasterWorkspaceShell definition={companyDefinition} />;
}
