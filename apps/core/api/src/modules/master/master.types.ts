export type MasterKind = "company" | "contact" | "product" | "work-order";

export type MasterModuleEvent = {
  name: "core.master.created" | "core.master.updated";
  payload: {
    kind: MasterKind;
    tenantId: string;
    uuid: string;
  };
};
