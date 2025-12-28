const mongoose = require('mongoose');
const SavingsGoal = require('../../src/models/SavingsGoal');

describe('SavingsGoal model', () => {
  test('virtuals pourcentageProgression et montantRestant', () => {
    const s = new SavingsGoal({ nom: 'Test', objectifMontant: 1000, montantActuel: 250 });
    expect(s.pourcentageProgression).toBeCloseTo(25);
    expect(s.montantRestant).toBe(750);
  });

  test('ajouterMontant augmente montantActuel et change statut', async () => {
    const s = new SavingsGoal({ nom: 'T', objectifMontant: 100, montantActuel: 90, utilisateurId: new mongoose.Types.ObjectId() });
    // Stub save to avoid middleware issues in unit tests
    s.save = async () => {};
    await s.ajouterMontant(15);
    expect(s.montantActuel).toBe(105);
    expect(s.statut).toBe('termine');
  });

  test('retirerMontant diminue montantActuel', async () => {
    const s = new SavingsGoal({ nom: 'T2', montantActuel: 200, utilisateurId: new mongoose.Types.ObjectId() });
    s.save = async () => {};
    await s.retirerMontant(50);
    expect(s.montantActuel).toBe(150);
  });
});
