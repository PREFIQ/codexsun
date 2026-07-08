export const countryWorker = {
  jobs: ["country.import"],
  maxAttempts: 3
} as const;

export async function processCountryImport<T>(records: T[], persist: (record: T) => Promise<void>) {
  for (const record of records) await persist(record);
  return { imported: records.length };
}
