import { MasterRecordShell } from "../master.workspace";
import { contactDefinition } from "./contact.definition";

const contactTabs = ["details", "tax", "communication", "addresses", "finance", "more", "settings"] as const;

export function ContactWorkspace() {
  return <MasterRecordShell definition={contactDefinition} tabs={[...contactTabs]} />;
}
