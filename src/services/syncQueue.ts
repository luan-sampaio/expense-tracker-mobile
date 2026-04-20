import { PendingMutation, Transaction } from '../types';

type PendingMutationInput =
  | {
      type: 'create';
      transaction: Transaction;
    }
  | {
      type: 'update';
      transaction: Transaction;
    }
  | {
      type: 'delete';
      transactionId: string;
    };

export function createClientId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function normalizeTransaction(transaction: Transaction): Transaction {
  return { ...transaction, amount: Number(transaction.amount) };
}

export function createPendingMutation(mutation: PendingMutationInput): PendingMutation {
  return {
    ...mutation,
    id: createClientId(),
    createdAt: new Date().toISOString(),
  };
}

function getMutationTransactionId(mutation: PendingMutation) {
  return mutation.type === 'delete'
    ? mutation.transactionId
    : mutation.transaction.id;
}

export function compactQueue(queue: PendingMutation[], next: PendingMutation) {
  const nextTransactionId = getMutationTransactionId(next);
  const filtered = queue.filter((mutation) => {
    return getMutationTransactionId(mutation) !== nextTransactionId;
  });

  return [...filtered, next];
}

export function applyPendingMutations(
  transactions: Transaction[],
  pendingMutations: PendingMutation[]
) {
  const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));

  pendingMutations.forEach((mutation) => {
    if (mutation.type === 'delete') {
      byId.delete(mutation.transactionId);
    } else {
      byId.set(mutation.transaction.id, mutation.transaction);
    }
  });

  return Array.from(byId.values());
}

export function removeAppliedMutations(
  queue: PendingMutation[],
  appliedMutationIds: string[]
) {
  const applied = new Set(appliedMutationIds);
  return queue.filter((mutation) => !applied.has(mutation.id));
}
