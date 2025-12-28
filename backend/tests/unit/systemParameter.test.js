const SystemParameter = require('../../src/models/SystemParameter');

describe('SystemParameter model', () => {
  test('defaults and basic methods', () => {
    const param = new SystemParameter();
    // defaults
    expect(param.deviseParDefaut).toBe('XOF');
    expect(param.montantMinTransaction).toBeGreaterThanOrEqual(0);
    expect(param.version).toBeDefined();

    // verifierMontantValide
    const tooSmall = param.verifierMontantValide(param.montantMinTransaction - 1);
    expect(tooSmall.valide).toBe(false);

    const ok = param.verifierMontantValide(param.montantMinTransaction + 100);
    expect(ok.valide).toBe(true);

    // calculerFrais
    const frais = param.calculerFrais(1000, 'transfert');
    expect(typeof frais).toBe('number');

    // maintenance flag
    expect(param.estEnMaintenance()).toBe(false);

    // obtenirResume
    const resume = param.obtenirResume();
    expect(resume).toHaveProperty('limites');
    expect(resume).toHaveProperty('securite');
  });
});
