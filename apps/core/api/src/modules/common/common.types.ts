export type CommonModuleArea = "contacts" | "location" | "others" | "products" | "workorder";

export type CommonModuleRegistration = {
  area: CommonModuleArea;
  moduleKeys: string[];
};
