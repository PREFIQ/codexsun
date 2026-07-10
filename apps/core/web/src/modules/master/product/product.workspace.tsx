import { MasterWorkspaceShell } from "../master.workspace";
import { productDefinition } from "./product.definition";
import { nextProductCode, productTabs } from "./product.form";

export function ProductWorkspace() {
  return <MasterWorkspaceShell createCode={nextProductCode} definition={productDefinition} tabs={[...productTabs]} />;
}
