import { useQuery } from "@tanstack/react-query";
import {
  getReceiptContext,
  listReceiptAllocations,
  listReceiptContacts,
  listReceiptLedgers,
  listReceipts
} from "./receipt.services";
export const receiptQueryKey = ["billing", "receipts"] as const;
export function useReceiptList() {
  return useQuery({ queryFn: listReceipts, queryKey: receiptQueryKey });
}
export function useReceiptContext() {
  return useQuery({ queryFn: getReceiptContext, queryKey: [...receiptQueryKey, "context"] });
}
export function useReceiptFormLookups(customerId: number) {
  const contacts = useQuery({
    queryFn: listReceiptContacts,
    queryKey: [...receiptQueryKey, "contacts"]
  });
  const ledgers = useQuery({
    queryFn: listReceiptLedgers,
    queryKey: [...receiptQueryKey, "ledgers"]
  });
  const allocations = useQuery({
    enabled: customerId > 0,
    queryFn: () => listReceiptAllocations(customerId),
    queryKey: [...receiptQueryKey, "allocations", customerId]
  });
  return { allocations, contacts, ledgers };
}
