import { MasterRecordShell } from "../../master/master.workspace";
import { companyDefinition } from "./company.definition";

const companyTabs = ["details", "tax", "communication", "addresses", "finance", "more", "logos", "settings"] as const;

export function CompanyWorkspace() {
  return <MasterRecordShell definition={companyDefinition} tabs={[...companyTabs]} />;
}
