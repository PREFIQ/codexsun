export type BankAccountBlock = {
  accountId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branchName?: string;
  isDefault: boolean;
};
