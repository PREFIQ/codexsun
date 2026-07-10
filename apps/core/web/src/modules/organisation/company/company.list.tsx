import { MasterList } from "../../master/master.workspace";
import { useMasterRecords } from "../../master/master.hooks";
import { companyDefinition } from "./company.definition";

export function CompanyList() {
  const query = useMasterRecords(companyDefinition);
  return <MasterList definition={companyDefinition} loading={query.isFetching && !query.data} records={query.data ?? []} onEdit={() => undefined} />;
}
