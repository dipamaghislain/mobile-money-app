// frontend/src/app/core/constants/transaction-types.ts
// Constantes pour les types de transactions - alignées avec le backend

/**
 * Types de transactions correspondant au backend
 */
export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW',
  TRANSFER: 'TRANSFER',
  MERCHANT_PAYMENT: 'MERCHANT_PAYMENT',
  EPARGNE_IN: 'EPARGNE_IN',
  EPARGNE_OUT: 'EPARGNE_OUT'
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

/**
 * Mapping des types de transactions vers les libellés en français
 */
export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  [TRANSACTION_TYPES.DEPOSIT]: 'Dépôt',
  [TRANSACTION_TYPES.WITHDRAW]: 'Retrait',
  [TRANSACTION_TYPES.TRANSFER]: 'Transfert',
  [TRANSACTION_TYPES.MERCHANT_PAYMENT]: 'Paiement marchand',
  [TRANSACTION_TYPES.EPARGNE_IN]: 'Versement épargne',
  [TRANSACTION_TYPES.EPARGNE_OUT]: 'Retrait épargne'
};

/**
 * Mapping des types de transactions vers les icônes Material
 */
export const TRANSACTION_ICONS: Record<TransactionType, string> = {
  [TRANSACTION_TYPES.DEPOSIT]: 'add_circle',
  [TRANSACTION_TYPES.WITHDRAW]: 'remove_circle',
  [TRANSACTION_TYPES.TRANSFER]: 'swap_horiz',
  [TRANSACTION_TYPES.MERCHANT_PAYMENT]: 'store',
  [TRANSACTION_TYPES.EPARGNE_IN]: 'savings',
  [TRANSACTION_TYPES.EPARGNE_OUT]: 'money_off'
};

/**
 * Types de transactions qui sont des crédits (argent reçu)
 */
export const CREDIT_TYPES: TransactionType[] = [
  TRANSACTION_TYPES.DEPOSIT,
  TRANSACTION_TYPES.EPARGNE_OUT
];

/**
 * Types de transactions qui sont des débits (argent envoyé)
 */
export const DEBIT_TYPES: TransactionType[] = [
  TRANSACTION_TYPES.WITHDRAW,
  TRANSACTION_TYPES.TRANSFER,
  TRANSACTION_TYPES.MERCHANT_PAYMENT,
  TRANSACTION_TYPES.EPARGNE_IN
];

/**
 * Vérifie si une transaction est un crédit
 */
export function isCredit(type: TransactionType, isRecipient: boolean = false): boolean {
  // Pour un transfert, c'est un crédit si on est le destinataire
  if (type === TRANSACTION_TYPES.TRANSFER) {
    return isRecipient;
  }
  return CREDIT_TYPES.includes(type);
}

/**
 * Vérifie si une transaction est un débit
 */
export function isDebit(type: TransactionType, isRecipient: boolean = false): boolean {
  return !isCredit(type, isRecipient);
}

/**
 * Retourne le libellé d'un type de transaction
 */
export function getTransactionLabel(type: TransactionType): string {
  return TRANSACTION_LABELS[type] || type;
}

/**
 * Retourne l'icône d'un type de transaction
 */
export function getTransactionIcon(type: TransactionType): string {
  return TRANSACTION_ICONS[type] || 'swap_horiz';
}

/**
 * Retourne la classe CSS pour la couleur de la transaction
 */
export function getTransactionColorClass(type: TransactionType, isRecipient: boolean = false): string {
  return isCredit(type, isRecipient) ? 'transaction-credit' : 'transaction-debit';
}

/**
 * Statuts de transaction correspondant au backend
 */
export const TRANSACTION_STATUS = {
  SUCCESS: 'SUCCES',
  FAILED: 'ECHEC',
  PENDING: 'EN_ATTENTE'
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

/**
 * Mapping des statuts vers les libellés
 */
export const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.SUCCESS]: 'Réussi',
  [TRANSACTION_STATUS.FAILED]: 'Échoué',
  [TRANSACTION_STATUS.PENDING]: 'En attente'
};

/**
 * Mapping des statuts vers les classes CSS
 */
export const STATUS_CLASSES: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.SUCCESS]: 'status-success',
  [TRANSACTION_STATUS.FAILED]: 'status-failed',
  [TRANSACTION_STATUS.PENDING]: 'status-pending'
};


