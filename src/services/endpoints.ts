export const TRANSACTIONS_ENDPOINT = '/transactions/';
export const TRANSACTIONS_SYNC_ENDPOINT = '/transactions/sync';

export function transactionEndpoint(id: string) {
  return `${TRANSACTIONS_ENDPOINT}${id}/`;
}

