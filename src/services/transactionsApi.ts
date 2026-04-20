import { api } from '../lib/api';
import { PendingMutation, Transaction } from '../types';
import {
  TRANSACTIONS_ENDPOINT,
  TRANSACTIONS_SYNC_ENDPOINT,
  transactionEndpoint,
} from './endpoints';

type TransactionSyncOperation = {
  operation: 'add' | 'update' | 'remove';
  transaction_id?: string;
  transaction?: Transaction;
  client_operation_id: string;
};

type TransactionSyncResult = {
  client_operation_id: string;
  status: 'applied' | 'failed';
};

export type TransactionSyncResponse = {
  results: TransactionSyncResult[];
  transactions: Transaction[];
};

function toSyncOperation(mutation: PendingMutation): TransactionSyncOperation {
  if (mutation.type === 'create') {
    return {
      operation: 'add',
      transaction: mutation.transaction,
      client_operation_id: mutation.id,
    };
  }

  if (mutation.type === 'update') {
    return {
      operation: 'update',
      transaction: mutation.transaction,
      client_operation_id: mutation.id,
    };
  }

  return {
    operation: 'remove',
    transaction_id: mutation.transactionId,
    client_operation_id: mutation.id,
  };
}

export const transactionsApi = {
  list: () => api.get<Transaction[]>(TRANSACTIONS_ENDPOINT),

  create: (transaction: Transaction) =>
    api.post<Transaction>(TRANSACTIONS_ENDPOINT, transaction),

  update: (transaction: Transaction) =>
    api.put<Transaction>(transactionEndpoint(transaction.id), transaction),

  remove: (id: string) => api.delete(transactionEndpoint(id)),

  sync: (pendingMutations: PendingMutation[]) => {
    if (pendingMutations.length === 0) {
      return null;
    }

    return api.post<TransactionSyncResponse>(TRANSACTIONS_SYNC_ENDPOINT, {
      operations: pendingMutations.map(toSyncOperation),
    });
  },
};
