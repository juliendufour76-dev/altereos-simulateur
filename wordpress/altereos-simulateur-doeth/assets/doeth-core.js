/*!
 * Simulateur DOETH / contribution OETH — moteur de calcul
 * AlterEos — entreprise adaptée
 *
 * Moteur pur : aucune dépendance, aucun DOM, aucun appel réseau.
 * Utilisable en navigateur (window.AlterEosDOETH) et en Node (module.exports).
 *
 * Sources du barème (vérifiées le 05/08/2026) :
 *  - Code du travail, art. L5212-1 et s., D5212-19 à D5212-28
 *  - Agefiph, « Calcul de la contribution OETH »
 *  - Urssaf, « Contribution annuelle OETH » + Guide OETH
 *
 * ATTENTION : outil d'estimation. Il ne se substitue pas à la déclaration
 * en DSN ni à l'effectif d'assujettissement notifié par l'Urssaf/MSA.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlterEosDOETH = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  1. BARÈME — une entrée par année de référence.
   *     Mettre à jour ici, et ici seulement, à chaque campagne.
   * ------------------------------------------------------------------ */

  var BAREME = {
    2025: {
      annee: 2025,
      declaration: 'DSN d’avril 2026, exigible le 5 ou 15 mai 2026',
      // SMIC horaire brut en vigueur au 31 décembre de l'année de référence.
      // Pas de revalorisation en 2025 : le SMIC du 01/11/2024 est resté applicable.
      smicHoraire: 11.88,
      smicProvisoire: false,
      smicSource: 'SMIC horaire brut au 31/12/2025',
      tauxObligation: 0.06,
      seuilAssujettissement: 20,
      coefficients: [
        { min: 20, max: 249, valeur: 400 },
        { min: 250, max: 749, valeur: 500 },
        { min: 750, max: Infinity, valeur: 600 }
      ],
      coefficientSurcontribution: 1500,
      coefficientDerogationEcap: 40, // établissements dont l'effectif ECAP ≥ 80 %
      ecapMultiplicateur: 17,
      tauxDeductionSousTraitance: 0.30,
      plafondSousTraitanceBas: 0.50, // taux d'emploi < 3 %
      plafondSousTraitanceHaut: 0.75, // taux d'emploi ≥ 3 %
      seuilTauxEmploiPlafond: 0.03,
      plafondDepensesDeductibles: 0.10,
      ecretement: null, // supprimé depuis le 01/01/2025
      majorationSenior: 1.5,
      ageSenior: 50
    },
    2026: {
      annee: 2026,
      declaration: 'DSN d’avril 2027, exigible le 5 ou 15 mai 2027',
      // Revalorisation du 01/06/2026. À confirmer au 31/12/2026 : une
      // revalorisation de fin d'année modifierait ce montant.
      smicHoraire: 12.31,
      smicProvisoire: true,
      smicSource: 'SMIC horaire brut au 01/06/2026, valeur provisoire',
      tauxObligation: 0.06,
      seuilAssujettissement: 20,
      coefficients: [
        { min: 20, max: 249, valeur: 400 },
        { min: 250, max: 749, valeur: 500 },
        { min: 750, max: Infinity, valeur: 600 }
      ],
      coefficientSurcontribution: 1500,
      coefficientDerogationEcap: 40,
      ecapMultiplicateur: 17,
      tauxDeductionSousTraitance: 0.30,
      plafondSousTraitanceBas: 0.50,
      plafondSousTraitanceHaut: 0.75,
      seuilTauxEmploiPlafond: 0.03,
      plafondDepensesDeductibles: 0.10,
      ecretement: null,
      majorationSenior: 1.5,
      ageSenior: 50
    }
  };

  var ANNEE_PAR_DEFAUT = 2026;

  /* ------------------------------------------------------------------ *
   *  2. Utilitaires
   * ------------------------------------------------------------------ */

  function nombre(valeur, defaut) {
    var n = typeof valeur === 'string' ? parseFloat(valeur.replace(',', '.')) : valeur;
    if (typeof n !== 'number' || !isFinite(n) || n < 0) return defaut || 0;
    return n;
  }

  function arrondi(n, decimales) {
    var f = Math.pow(10, decimales === undefined ? 2 : decimales);
    return Math.round((n + Number.EPSILON) * f) / f;
  }

  function coefficientTaille(bareme, effectif) {
    for (var i = 0; i < bareme.coefficients.length; i++) {
      var t = bareme.coefficients[i];
      if (effectif >= t.min && effectif <= t.max) return t.valeur;
    }
    return bareme.coefficients[bareme.coefficients.length - 1].valeur;
  }

  function trancheLibelle(effectif) {
    if (effectif < 20) return 'moins de 20 salariés';
    if (effectif < 250) return '20 à 249 salariés';
    if (effectif < 750) return '250 à 749 salariés';
    return '750 salariés et plus';
  }

  /* ------------------------------------------------------------------ *
   *  3. Normalisation des entrées
   * ------------------------------------------------------------------ */

  function normaliser(saisie) {
    var s = saisie || {};
    var annee = BAREME[s.annee] ? s.annee : ANNEE_PAR_DEFAUT;
    var effectif = nombre(s.effectifAssujettissement, 0);
    var internes = nombre(s.boethInternes, 0);

    return {
      annee: annee,
      // Effectif moyen annuel d'assujettissement, notifié par l'Urssaf/MSA au 15 mars.
      effectifAssujettissement: effectif,
      // Effectif moyen annuel des BOETH salariés de l'entreprise.
      boethInternes: internes,
      // Parmi les BOETH salariés, ceux âgés de 50 ans et plus (majoration × 1,5).
      boethSeniors: Math.min(nombre(s.boethSeniors, 0), internes),
      // BOETH accueillis : mise à disposition, intérim, stagiaires, PMSMP.
      boethExternes: nombre(s.boethExternes, 0),
      // Effectif moyen annuel sur un emploi exigeant des conditions d'aptitude
      // particulières (ECAP), au sens de l'art. D5212-25.
      ecapEffectif: nombre(s.ecapEffectif, 0),
      // Dérogation des établissements dont l'effectif ECAP ≥ 80 % : coefficient 40.
      ecapDerogation: !!s.ecapDerogation,
      // Coût de la main-d'œuvre HT (« montant 3 ») des contrats EA / ESAT / TIH / EPS.
      coutMainOeuvreSecteurAdapte: nombre(s.coutMainOeuvreSecteurAdapte, 0),
      // Dépenses déductibles HT (accessibilité, maintien dans l'emploi, etc.).
      depensesDeductibles: nombre(s.depensesDeductibles, 0),
      // Aucune action en faveur de l'emploi des TH sur plus de 3 années consécutives.
      surcontribution: !!s.surcontribution,
      // Accord agréé de branche, de groupe ou d'entreprise en cours d'application.
      accordAgree: !!s.accordAgree,
      // Franchissement du seuil de 20 salariés il y a moins de 5 ans (loi PACTE).
      franchissementSeuil: !!s.franchissementSeuil
    };
  }

  /* ------------------------------------------------------------------ *
   *  4. Calcul
   * ------------------------------------------------------------------ */

  function calculer(saisie) {
    var e = normaliser(saisie);
    var b = BAREME[e.annee];
    var alertes = [];

    var resultat = {
      saisie: e,
      bareme: b,
      assujetti: true,
      motifNonAssujettissement: null,
      trancheEffectif: trancheLibelle(e.effectifAssujettissement),
      alertes: alertes
    };

    /* -- 4.1 Assujettissement ---------------------------------------- */

    if (e.effectifAssujettissement < b.seuilAssujettissement) {
      resultat.assujetti = false;
      resultat.motifNonAssujettissement = 'effectif-insuffisant';
    } else if (e.franchissementSeuil) {
      resultat.assujetti = false;
      resultat.motifNonAssujettissement = 'franchissement-seuil';
    }

    /* -- 4.2 Unités bénéficiaires et taux d'emploi -------------------- */

    // Un BOETH de 50 ans et plus compte pour 1,5 unité : sa majoration est
    // donc de + 0,5 unité par rapport au décompte de droit commun.
    var majoration = e.boethSeniors * (b.majorationSenior - 1);
    var unitesBeneficiaires = arrondi(e.boethInternes + majoration + e.boethExternes, 2);

    var tauxEmploi = e.effectifAssujettissement > 0
      ? unitesBeneficiaires / e.effectifAssujettissement
      : 0;

    // Obligation légale : 6 % de l'effectif d'assujettissement, arrondi à
    // l'unité inférieure.
    var obligation = Math.floor(b.tauxObligation * e.effectifAssujettissement);
    var manquants = arrondi(Math.max(0, obligation - unitesBeneficiaires), 2);

    resultat.unitesBeneficiaires = unitesBeneficiaires;
    resultat.majorationSeniors = arrondi(majoration, 2);
    resultat.tauxEmploi = tauxEmploi;
    resultat.tauxEmploiPourcent = arrondi(tauxEmploi * 100, 2);
    resultat.obligationLegale = obligation;
    resultat.beneficiairesManquants = manquants;
    resultat.objectifAtteint = manquants === 0;

    /* -- 4.3 Contribution brute --------------------------------------- */

    var coefficient, natureCoefficient;
    if (e.ecapDerogation) {
      coefficient = b.coefficientDerogationEcap;
      natureCoefficient = 'derogation-ecap';
    } else if (e.surcontribution) {
      coefficient = b.coefficientSurcontribution;
      natureCoefficient = 'surcontribution';
    } else {
      coefficient = coefficientTaille(b, e.effectifAssujettissement);
      natureCoefficient = 'taille';
    }

    var brute = resultat.assujetti
      ? arrondi(manquants * coefficient * b.smicHoraire, 2)
      : 0;

    resultat.coefficient = coefficient;
    resultat.natureCoefficient = natureCoefficient;
    resultat.smicHoraire = b.smicHoraire;
    resultat.contributionBrute = brute;

    /* -- 4.4 Déductions ----------------------------------------------- */

    var restant = brute;

    // a. Minoration ECAP : effectif ECAP × 17 × SMIC horaire brut.
    var ecapTheorique = arrondi(e.ecapEffectif * b.ecapMultiplicateur * b.smicHoraire, 2);
    var ecapApplique = e.ecapDerogation ? 0 : Math.min(ecapTheorique, restant);
    restant = arrondi(restant - ecapApplique, 2);

    // b. Sous-traitance EA / ESAT / TIH / EPS : 30 % du coût de main-d'œuvre,
    //    plafonné à 50 % de la contribution brute (75 % si le taux d'emploi
    //    direct atteint 3 %).
    var tauxPlafondST = tauxEmploi >= b.seuilTauxEmploiPlafond
      ? b.plafondSousTraitanceHaut
      : b.plafondSousTraitanceBas;
    var plafondST = arrondi(brute * tauxPlafondST, 2);
    var stTheorique = arrondi(e.coutMainOeuvreSecteurAdapte * b.tauxDeductionSousTraitance, 2);
    var stApplique = Math.min(stTheorique, plafondST, restant);
    restant = arrondi(restant - stApplique, 2);

    // c. Dépenses déductibles : plafonnées à 10 % de la contribution brute.
    var plafondDepenses = arrondi(brute * b.plafondDepensesDeductibles, 2);
    var depTheorique = e.depensesDeductibles;
    var depApplique = Math.min(depTheorique, plafondDepenses, restant);
    restant = arrondi(restant - depApplique, 2);

    var totalDeductions = arrondi(ecapApplique + stApplique + depApplique, 2);
    var nette = arrondi(Math.max(0, brute - totalDeductions), 2);

    resultat.deductions = {
      ecap: {
        theorique: ecapTheorique,
        applique: arrondi(ecapApplique, 2),
        plafond: null,
        formule: e.ecapEffectif + ' × 17 × ' + b.smicHoraire + ' €'
      },
      sousTraitance: {
        theorique: stTheorique,
        applique: arrondi(stApplique, 2),
        plafond: plafondST,
        tauxPlafond: tauxPlafondST,
        plafonnee: stTheorique > plafondST,
        formule: '30 % de ' + e.coutMainOeuvreSecteurAdapte + ' €'
      },
      depenses: {
        theorique: depTheorique,
        applique: arrondi(depApplique, 2),
        plafond: plafondDepenses,
        plafonnee: depTheorique > plafondDepenses,
        formule: 'plafond de 10 % de la contribution brute'
      },
      total: totalDeductions
    };

    resultat.contributionNette = nette;
    resultat.contributionDue = e.accordAgree ? 0 : nette;
    resultat.neutralisee = e.accordAgree && nette > 0;

    /* -- 4.5 Le levier : ce qui reste mobilisable --------------------- */

    // Marge de déduction encore disponible sous le plafond sous-traitance.
    var margeDeduction = arrondi(Math.max(0, Math.min(plafondST, brute) - stApplique), 2);
    // Coût de main-d'œuvre HT à confier au secteur adapté pour l'atteindre.
    var achatsPourSaturer = b.tauxDeductionSousTraitance > 0
      ? arrondi(margeDeduction / b.tauxDeductionSousTraitance, 0)
      : 0;
    // Ce que le plafond haut ajouterait si le taux d'emploi direct atteignait 3 %.
    var gainSiPlafondHaut = tauxEmploi < b.seuilTauxEmploiPlafond
      ? arrondi(brute * (b.plafondSousTraitanceHaut - b.plafondSousTraitanceBas), 2)
      : 0;

    resultat.levier = {
      margeDeduction: margeDeduction,
      achatsPourSaturerPlafond: achatsPourSaturer,
      plafondSousTraitance: plafondST,
      tauxPlafond: tauxPlafondST,
      gainSiPlafondHaut: gainSiPlafondHaut,
      // Économie annuelle apportée par une unité bénéficiaire supplémentaire.
      economieParEmbauche: resultat.assujetti && manquants > 0
        ? arrondi(Math.min(1, manquants) * coefficient * b.smicHoraire, 2)
        : 0
    };

    /* -- 4.6 La bascule : répartition de la contribution brute -------- */

    // Trois masses qui, ensemble, valent toujours la contribution brute.
    resultat.bascule = {
      base: brute,
      part: {
        du: nette, // reste dû à l'Urssaf
        deduit: totalDeductions, // déjà transformé en déductions
        mobilisable: Math.min(margeDeduction, nette) // encore convertible
      }
    };
    resultat.bascule.part.duIrreductible = arrondi(
      Math.max(0, nette - resultat.bascule.part.mobilisable), 2
    );

    /* -- 4.7 Alertes ---------------------------------------------------*/

    if (!resultat.assujetti && resultat.motifNonAssujettissement === 'effectif-insuffisant') {
      alertes.push({
        niveau: 'info',
        titre: 'Vous n’êtes pas assujetti',
        texte: 'L’obligation d’emploi s’applique à partir de 20 salariés. Vous restez ' +
          'soumis à la déclaration en DSN, mais aucune contribution n’est due.'
      });
    }
    if (resultat.motifNonAssujettissement === 'franchissement-seuil') {
      alertes.push({
        niveau: 'info',
        titre: 'Franchissement de seuil neutralisé',
        texte: 'Une entreprise qui atteint 20 salariés dispose de 5 années avant d’être ' +
          'redevable de la contribution.'
      });
    }
    if (b.smicProvisoire) {
      alertes.push({
        niveau: 'attention',
        titre: 'SMIC de référence provisoire',
        texte: 'Le calcul retient le SMIC horaire au 31 décembre ' + b.annee + '. ' +
          'Une revalorisation d’ici la fin de l’année modifierait le montant.'
      });
    }
    if (e.surcontribution) {
      alertes.push({
        niveau: 'attention',
        titre: 'Surcontribution appliquée',
        texte: 'Le coefficient passe à 1 500 fois le SMIC horaire. Un seul contrat de ' +
          'sous-traitance d’au moins 600 fois le SMIC sur 4 ans suffit à en sortir.'
      });
    }
    if (resultat.deductions.sousTraitance.plafonnee) {
      alertes.push({
        niveau: 'attention',
        titre: 'Déduction plafonnée',
        texte: 'Vos achats dépassent le plafond de ' + Math.round(tauxPlafondST * 100) +
          ' % de la contribution brute. La part excédentaire n’est pas déductible.'
      });
    }
    if (resultat.deductions.depenses.plafonnee) {
      alertes.push({
        niveau: 'attention',
        titre: 'Dépenses déductibles plafonnées',
        texte: 'Ces dépenses sont retenues dans la limite de 10 % de la contribution brute.'
      });
    }
    if (resultat.neutralisee) {
      alertes.push({
        niveau: 'info',
        titre: 'Contribution neutralisée',
        texte: 'Sous accord agréé, la contribution n’est pas versée à l’Urssaf : elle ' +
          'finance le programme d’actions prévu par l’accord.'
      });
    }

    return resultat;
  }

  /* ------------------------------------------------------------------ *
   *  5. Simulation inverse — dimensionner un contrat
   * ------------------------------------------------------------------ */

  /**
   * Recalcule le résultat pour un montant de coût de main-d'œuvre donné.
   * Sert au curseur de la bascule : la saisie ne change pas, seul l'achat varie.
   */
  function simulerAchat(saisie, coutMainOeuvre) {
    var copie = normaliser(saisie);
    copie.coutMainOeuvreSecteurAdapte = nombre(coutMainOeuvre, 0);
    return calculer(copie);
  }

  return {
    BAREME: BAREME,
    ANNEE_PAR_DEFAUT: ANNEE_PAR_DEFAUT,
    anneesDisponibles: function () {
      return Object.keys(BAREME).map(Number).sort();
    },
    normaliser: normaliser,
    calculer: calculer,
    simulerAchat: simulerAchat,
    version: '1.0.0'
  };
});
