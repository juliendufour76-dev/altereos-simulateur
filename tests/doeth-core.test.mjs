/**
 * Tests du moteur de calcul DOETH.
 * Lancer : node --test tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DOETH = require('../assets/doeth-core.js');

const proche = (a, b, tolerance = 0.01) =>
  assert.ok(Math.abs(a - b) <= tolerance, `attendu ${b}, obtenu ${a}`);

test('entreprise de moins de 20 salariés : non assujettie', () => {
  const r = DOETH.calculer({ annee: 2025, effectifAssujettissement: 19, boethInternes: 0 });
  assert.equal(r.assujetti, false);
  assert.equal(r.motifNonAssujettissement, 'effectif-insuffisant');
  assert.equal(r.contributionBrute, 0);
  assert.equal(r.contributionDue, 0);
});

test('franchissement du seuil de 20 salariés : neutralisé 5 ans', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 45, boethInternes: 0, franchissementSeuil: true
  });
  assert.equal(r.assujetti, false);
  assert.equal(r.contributionDue, 0);
});

test('cas de référence : 14 bénéficiaires manquants, coefficient 400, SMIC 2025', () => {
  // 250 salariés × 6 % = 15 ; 1 BOETH employé → 14 manquants.
  // Effectif 250 → coefficient 500. On force la tranche 400 avec 249 salariés.
  const r = DOETH.calculer({ annee: 2025, effectifAssujettissement: 249, boethInternes: 0 });
  assert.equal(r.obligationLegale, 14); // floor(249 × 0,06) = 14
  assert.equal(r.beneficiairesManquants, 14);
  assert.equal(r.coefficient, 400);
  proche(r.contributionBrute, 14 * 400 * 11.88); // 66 528 €
  proche(r.contributionBrute, 66528);
});

test('coefficients par tranche d’effectif', () => {
  const c = (effectif) =>
    DOETH.calculer({ annee: 2025, effectifAssujettissement: effectif, boethInternes: 0 }).coefficient;
  assert.equal(c(20), 400);
  assert.equal(c(249), 400);
  assert.equal(c(250), 500);
  assert.equal(c(749), 500);
  assert.equal(c(750), 600);
  assert.equal(c(5000), 600);
});

test('obligation arrondie à l’unité inférieure', () => {
  // 100 × 6 % = 6 exactement ; 110 × 6 % = 6,6 → 6.
  assert.equal(DOETH.calculer({ effectifAssujettissement: 100 }).obligationLegale, 6);
  assert.equal(DOETH.calculer({ effectifAssujettissement: 110 }).obligationLegale, 6);
  assert.equal(DOETH.calculer({ effectifAssujettissement: 117 }).obligationLegale, 7);
});

test('majoration de 50 % pour les bénéficiaires de 50 ans et plus', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 4, boethSeniors: 2
  });
  // 4 salariés BOETH dont 2 seniors → 4 + (2 × 0,5) = 5 unités.
  proche(r.unitesBeneficiaires, 5);
  proche(r.beneficiairesManquants, 1);
});

test('les seniors déclarés ne peuvent pas dépasser les BOETH internes', () => {
  const r = DOETH.calculer({ effectifAssujettissement: 100, boethInternes: 2, boethSeniors: 9 });
  proche(r.unitesBeneficiaires, 3); // 2 + (2 × 0,5)
});

test('bénéficiaires externes comptés dans les unités', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 200, boethInternes: 5, boethExternes: 3
  });
  proche(r.unitesBeneficiaires, 8);
  proche(r.tauxEmploiPourcent, 4);
});

test('objectif atteint : aucune contribution', () => {
  const r = DOETH.calculer({ annee: 2025, effectifAssujettissement: 100, boethInternes: 6 });
  assert.equal(r.objectifAtteint, true);
  assert.equal(r.contributionBrute, 0);
  assert.equal(r.contributionDue, 0);
});

test('minoration ECAP = effectif ECAP × 17 × SMIC', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0, ecapEffectif: 5
  });
  proche(r.deductions.ecap.theorique, 5 * 17 * 11.88); // 1 009,80 €
  proche(r.deductions.ecap.applique, 1009.8);
  proche(r.contributionNette, r.contributionBrute - 1009.8);
});

test('dérogation ECAP ≥ 80 % : coefficient 40 et pas de minoration cumulée', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0,
    ecapEffectif: 85, ecapDerogation: true
  });
  assert.equal(r.coefficient, 40);
  assert.equal(r.deductions.ecap.applique, 0);
  proche(r.contributionBrute, 6 * 40 * 11.88);
});

test('surcontribution : coefficient 1 500', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0, surcontribution: true
  });
  assert.equal(r.coefficient, 1500);
  proche(r.contributionBrute, 6 * 1500 * 11.88); // 106 920 €
  assert.ok(r.alertes.some((a) => a.titre.includes('Surcontribution')));
});

test('sous-traitance : 30 % du coût de main-d’œuvre, plafond 50 % sous 3 % d’emploi', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0,
    coutMainOeuvreSecteurAdapte: 30000
  });
  assert.equal(r.deductions.sousTraitance.tauxPlafond, 0.5);
  proche(r.deductions.sousTraitance.theorique, 9000);
  proche(r.deductions.sousTraitance.applique, 9000);
  proche(r.contributionNette, r.contributionBrute - 9000);
});

test('sous-traitance : plafond porté à 75 % dès 3 % d’emploi direct', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 3,
    coutMainOeuvreSecteurAdapte: 200000
  });
  assert.equal(r.deductions.sousTraitance.tauxPlafond, 0.75);
  proche(r.deductions.sousTraitance.plafond, r.contributionBrute * 0.75);
  proche(r.deductions.sousTraitance.applique, r.contributionBrute * 0.75);
  assert.equal(r.deductions.sousTraitance.plafonnee, true);
});

test('dépenses déductibles plafonnées à 10 % de la contribution brute', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0, depensesDeductibles: 50000
  });
  proche(r.deductions.depenses.plafond, r.contributionBrute * 0.1);
  proche(r.deductions.depenses.applique, r.contributionBrute * 0.1);
  assert.equal(r.deductions.depenses.plafonnee, true);
});

test('la contribution nette ne devient jamais négative', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0,
    ecapEffectif: 90, coutMainOeuvreSecteurAdapte: 500000, depensesDeductibles: 500000
  });
  assert.ok(r.contributionNette >= 0);
  proche(r.deductions.total, r.contributionBrute);
});

test('accord agréé : contribution due nulle mais brute conservée', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: 100, boethInternes: 0, accordAgree: true
  });
  assert.ok(r.contributionBrute > 0);
  assert.equal(r.contributionDue, 0);
  assert.equal(r.neutralisee, true);
});

test('la bascule répartit exactement la contribution brute', () => {
  const r = DOETH.calculer({
    annee: 2026, effectifAssujettissement: 340, boethInternes: 8, boethSeniors: 3,
    coutMainOeuvreSecteurAdapte: 40000, ecapEffectif: 2, depensesDeductibles: 1500
  });
  const somme = r.bascule.part.deduit + r.bascule.part.mobilisable + r.bascule.part.duIrreductible;
  proche(somme, r.contributionBrute, 0.05);
});

test('le levier chiffre l’achat qui sature le plafond', () => {
  const r = DOETH.calculer({ annee: 2026, effectifAssujettissement: 100, boethInternes: 0 });
  // Brute = 6 × 400 × 12,31 = 29 544 € ; plafond 50 % = 14 772 € ;
  // achat nécessaire = 14 772 / 0,30 = 49 240 €.
  proche(r.contributionBrute, 29544);
  proche(r.levier.margeDeduction, 14772);
  proche(r.levier.achatsPourSaturerPlafond, 49240, 1);
});

test('simulerAchat ne modifie pas la saisie d’origine', () => {
  const saisie = { annee: 2026, effectifAssujettissement: 100, coutMainOeuvreSecteurAdapte: 0 };
  const r = DOETH.simulerAchat(saisie, 20000);
  proche(r.deductions.sousTraitance.applique, 6000);
  assert.equal(saisie.coutMainOeuvreSecteurAdapte, 0);
});

test('les entrées textuelles et à virgule sont acceptées', () => {
  const r = DOETH.calculer({
    annee: 2025, effectifAssujettissement: '120', boethInternes: '3,5'
  });
  proche(r.unitesBeneficiaires, 3.5);
  proche(r.beneficiairesManquants, 3.5);
});

test('les valeurs aberrantes sont ramenées à zéro', () => {
  const r = DOETH.calculer({
    effectifAssujettissement: 100, boethInternes: -5, coutMainOeuvreSecteurAdapte: 'abc'
  });
  assert.equal(r.unitesBeneficiaires, 0);
  assert.equal(r.deductions.sousTraitance.theorique, 0);
});

test('barème : les deux années de référence sont exposées', () => {
  assert.deepEqual(DOETH.anneesDisponibles(), [2025, 2026]);
  assert.equal(DOETH.BAREME[2025].smicHoraire, 11.88);
  assert.equal(DOETH.BAREME[2026].smicProvisoire, true);
});
