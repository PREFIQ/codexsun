import { useQuery } from "@tanstack/react-query";
import { listContacts } from "./contact.services";
export function useContacts(search = "") {
  return useQuery({
    queryFn: () => listContacts(search),
    queryKey: ["core", "contact", "list", search]
  });
}
