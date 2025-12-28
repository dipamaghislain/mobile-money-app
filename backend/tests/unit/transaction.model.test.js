const Transaction = require('../../src/models/Transaction');

describe('Transaction model', () => {
  test('genererReference returns a string with TXN prefix', () => {
    const ref = Transaction.genererReference();
    expect(typeof ref).toBe('string');
    expect(ref.startsWith('TXN-')).toBe(true);
  });

  test('calculerFrais respects TRANSACTION_FEE_PERCENT env', () => {
    const txn = new Transaction({ montant: 1000 });
    process.env.TRANSACTION_FEE_PERCENT = '2.5';
    const frais = txn.calculerFrais();
    expect(frais).toBeCloseTo(25);
    delete process.env.TRANSACTION_FEE_PERCENT;
  });

  test('obtenirResume and montantTotal virtual', () => {
    const txn = new Transaction({ montant: 500, fraisTransaction: 10, type: 'DEPOSIT', devise: 'XOF' });
    const resume = txn.obtenirResume();
    expect(resume.montant).toBe(500);
    expect(resume.frais).toBe(10);
    expect(txn.montantTotal).toBe(510);
  });
});
