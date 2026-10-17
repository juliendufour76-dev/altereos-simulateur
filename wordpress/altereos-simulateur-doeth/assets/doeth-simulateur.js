/*!
 * Simulateur DOETH — AlterEos
 * Interface. Dépend de doeth-core.js (window.AlterEosDOETH).
 *
 * Montage :
 *   <div data-aeds
 *        data-annee="2026"
 *        data-formulaire-contact="#contact"
 *        data-champ-message="#projet-message"></div>
 *
 * data-formulaire-contact accepte un sélecteur CSS (bloc de la même page) ou
 * une URL (page contact distincte, le résumé est passé dans ?simulation=).
 *
 * Le module s'initialise seul sur tous les [data-aeds] présents au chargement.
 */
(function (window, document) {
  'use strict';

  var MOTEUR = window.AlterEosDOETH;
  if (!MOTEUR) {
    if (window.console) console.error('[AlterEos] doeth-core.js doit être chargé avant doeth-simulateur.js');
    return;
  }

  /* ------------------------------------------------------------------ *
   *  Formatage
   * ------------------------------------------------------------------ */

  var euros = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  });
  var eurosPrecis = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

  function fEuros(n) { return euros.format(Math.round(n || 0)); }
  function fEurosPrecis(n) { return eurosPrecis.format(n || 0); }
  function fNombre(n) { return decimal.format(n || 0); }
  function fPourcent(n) { return decimal.format(n || 0).replace(/\s/g, ' ') + ' %'; }

  // Arrondi commercial pour un ordre de grandeur lisible : 41 237 € → 41 000 €.
  function fArrondi(n) {
    var pas = n >= 10000 ? 1000 : 100;
    return fEuros(Math.round((n || 0) / pas) * pas);
  }

  /* ------------------------------------------------------------------ *
   *  Icônes — tracé unique, épaisseur 1,75
   * ------------------------------------------------------------------ */

  function icone(chemin, taille) {
    return '<svg width="' + (taille || 18) + '" height="' + (taille || 18) + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false">' + chemin + '</svg>';
  }

  var ICONES = {
    horloge: icone('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    bouclier: icone('<path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    info: icone('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
    attention: icone('<path d="M10.3 4.3 2.6 17.5A1.9 1.9 0 0 0 4.3 20.4h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 4.3a1.9 1.9 0 0 0-3.4 0Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'),
    fleche: icone('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    chevron: icone('<path d="m6 9 6 6 6-6"/>', 20),
    coche: icone('<path d="m5 12 5 5 9-10"/>', 16),
    feuille: icone('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>', 22)
  };

  /* ------------------------------------------------------------------ *
   *  Gabarit
   * ------------------------------------------------------------------ */

  function champNombre(id, label, aide, options) {
    var o = options || {};
    return '' +
      '<div class="aeds__champ">' +
        '<label class="aeds__label" for="' + id + '">' + label + '</label>' +
        (aide ? '<p class="aeds__aide" id="' + id + '-aide">' + aide + '</p>' : '') +
        '<div class="aeds__saisie' + (o.grand ? ' aeds__saisie--grand' : '') + '" data-enveloppe="' + id + '">' +
          '<input type="number" id="' + id + '" name="' + id + '" ' +
            'inputmode="' + (o.decimal ? 'decimal' : 'numeric') + '" ' +
            'min="' + (o.min !== undefined ? o.min : 0) + '" ' +
            (o.max !== undefined ? 'max="' + o.max + '" ' : '') +
            'step="' + (o.step || 1) + '" ' +
            'value="' + (o.valeur !== undefined ? o.valeur : '') + '" ' +
            'placeholder="' + (o.placeholder || '0') + '" ' +
            (aide ? 'aria-describedby="' + id + '-aide"' : '') + '>' +
          (o.unite ? '<span class="aeds__unite" aria-hidden="true">' + o.unite + '</span>' : '') +
        '</div>' +
        '<p class="aeds__erreur" id="' + id + '-erreur" hidden></p>' +
      '</div>';
  }

  function coche(id, titre, detail) {
    return '' +
      '<label class="aeds__coche" for="' + id + '">' +
        '<input type="checkbox" id="' + id + '" name="' + id + '">' +
        '<span><b>' + titre + '</b><small>' + detail + '</small></span>' +
      '</label>';
  }

  function gabarit(prefixe, annees, anneeActive) {
    var segments = annees.map(function (a) {
      return '<span class="aeds__segment">' +
        '<input type="radio" name="' + prefixe + '-annee" id="' + prefixe + '-annee-' + a + '" ' +
          'value="' + a + '"' + (a === anneeActive ? ' checked' : '') + '>' +
        '<span>' + a + '</span></span>';
    }).join('');

    return '' +
    '<section class="aeds__section" aria-labelledby="' + prefixe + '-titre">' +
    '<div class="aeds__contenu">' +

      '<header class="aeds__ouverture">' +
        '<h2 class="aeds__titre" id="' + prefixe + '-titre">Votre contribution OETH peut travailler pour vous</h2>' +
        '<p class="aeds__chapo">Deux chiffres suffisent pour estimer ce que vous versez chaque année, ' +
          'et la part que vous pouvez transformer en prestations utiles confiées à AlterEos.</p>' +
        '<ul class="aeds__meta">' +
          '<li>' + ICONES.horloge + 'Résultat en 30 secondes, sans inscription</li>' +
          '<li>' + ICONES.bouclier + 'Barème officiel Urssaf / Agefiph</li>' +
        '</ul>' +
      '</header>' +

      '<div class="aeds__atelier">' +

        /* ---------- Colonne saisie ---------- */
        '<form class="aeds__form" novalidate data-role="form">' +

          '<fieldset class="aeds__bloc">' +
            '<legend class="aeds__legende">Votre entreprise</legend>' +
            '<div class="aeds__champs">' +
              champNombre(prefixe + '-effectif', 'Nombre de salariés',
                'Effectif moyen annuel, tel que notifié par l’Urssaf ou la MSA.',
                { unite: 'salariés', placeholder: 'ex. 150', decimal: true, step: 0.01, grand: true }) +
              champNombre(prefixe + '-boeth', 'Dont salariés en situation de handicap',
                'Reconnus travailleurs handicapés (RQTH, invalidité, AAH…). Laissez vide si aucun.',
                { unite: 'pers.', placeholder: 'ex. 3', decimal: true, step: 0.01, grand: true }) +
            '</div>' +
          '</fieldset>' +

          '<details class="aeds__volet" data-role="affiner">' +
            '<summary>Affiner mon estimation <small>facultatif</small>' +
              '<span class="aeds__volet-fleche">' + ICONES.chevron + '</span></summary>' +
            '<div class="aeds__volet-corps">' +
              '<div class="aeds__champ">' +
                '<span class="aeds__label" id="' + prefixe + '-annee-label">Année déclarée</span>' +
                '<p class="aeds__aide" id="' + prefixe + '-annee-aide" data-role="annee-aide"></p>' +
                '<div class="aeds__segments" role="radiogroup" ' +
                  'aria-labelledby="' + prefixe + '-annee-label" ' +
                  'aria-describedby="' + prefixe + '-annee-aide">' + segments + '</div>' +
              '</div>' +
              '<div class="aeds__champs aeds__champs--duo">' +
                champNombre(prefixe + '-seniors', 'Dont 50 ans et plus',
                  'Chacun compte pour 1,5.',
                  { unite: 'pers.', decimal: true, step: 0.01 }) +
                champNombre(prefixe + '-externes', 'Bénéficiaires accueillis',
                  'Intérim, mise à disposition, stagiaires, PMSMP.',
                  { unite: 'pers.', decimal: true, step: 0.01 }) +
              '</div>' +
              '<div class="aeds__champs aeds__champs--duo">' +
                champNombre(prefixe + '-achats', 'Achats déjà réalisés au secteur adapté',
                  'Coût de main-d’œuvre indiqué sur l’attestation de votre prestataire (EA, ESAT, TIH).',
                  { unite: '€ HT', step: 100 }) +
                champNombre(prefixe + '-depenses', 'Dépenses déductibles',
                  'Accessibilité, maintien dans l’emploi… Limitées à 10 % de la contribution.',
                  { unite: '€ HT', step: 100 }) +
              '</div>' +
              '<div class="aeds__champs">' +
                champNombre(prefixe + '-ecap', 'Salariés sur un emploi ECAP',
                  'Postes exigeant des conditions d’aptitude particulières (conduite, sécurité…).',
                  { unite: 'pers.', decimal: true, step: 0.01 }) +
              '</div>' +
              '<div class="aeds__coches">' +
                coche(prefixe + '-ecap-derogation', 'Établissement dont l’effectif ECAP atteint 80 %',
                  'Le coefficient tombe à 40 fois le SMIC horaire.') +
                coche(prefixe + '-surcontribution', 'Aucune action en faveur de l’emploi des personnes handicapées depuis plus de 3 ans',
                  'Ni bénéficiaire employé, ni contrat au secteur adapté d’au moins 600 fois le SMIC, ni accord agréé.') +
                coche(prefixe + '-accord', 'Accord agréé en cours d’application',
                  'La contribution finance le programme d’actions de l’accord.') +
                coche(prefixe + '-seuil', 'Seuil de 20 salariés franchi il y a moins de 5 ans',
                  'La contribution est suspendue pendant 5 ans.') +
              '</div>' +
            '</div>' +
          '</details>' +

        '</form>' +

        /* ---------- Colonne résultat ---------- */
        '<div class="aeds__resultat">' +
          '<div class="aeds__panneau">' +

            '<div class="aeds__panneau-tete">' +
              '<h3 class="aeds__panneau-titre">Votre contribution estimée</h3>' +
              '<p class="aeds__panneau-sous" data-role="sous-titre">Indiquez votre nombre de salariés.</p>' +
              '<strong class="aeds__montant" data-role="montant">—</strong>' +
              '<p class="aeds__montant-note" data-role="montant-note">Le résultat s’affiche ici, sans e-mail ni inscription.</p>' +
            '</div>' +

            '<div class="aeds__opportunite" data-role="opportunite" hidden>' +
              '<span class="aeds__opportunite-icone">' + ICONES.feuille + '</span>' +
              '<div>' +
                '<p class="aeds__opportunite-titre">Jusqu’à <strong data-role="mobilisable">—</strong> ' +
                  'déductibles de cette contribution</p>' +
                '<p class="aeds__opportunite-texte" data-role="opportunite-texte"></p>' +
              '</div>' +
            '</div>' +

            '<div class="aeds__cta" data-role="cta-bloc">' +
              '<h4 class="aeds__cta-titre" data-role="cta-titre">Allez plus loin avec un expert AlterEos</h4>' +
              '<ul class="aeds__cta-liste">' +
                '<li>' + ICONES.coche + 'Vérification de votre calcul avec vos chiffres réels</li>' +
                '<li>' + ICONES.coche + 'Prestations déductibles adaptées à vos besoins</li>' +
                '<li>' + ICONES.coche + 'Un plan pour réduire durablement votre contribution</li>' +
              '</ul>' +
              '<button type="button" class="aeds__bouton aeds__bouton--principal" data-role="cta" data-emplacement="panneau">' +
                'Être rappelé par un expert' + ICONES.fleche + '</button>' +
              '<p class="aeds__pied-note">Échange de 30 minutes, gratuit et sans engagement.</p>' +
            '</div>' +

          '</div>' +

          '<div class="aeds__alertes" data-role="alertes"></div>' +
        '</div>' +

      '</div>' +

      /* ---------- Détail, replié ---------- */
      '<details class="aeds__volet aeds__detail" data-role="detail" hidden>' +
        '<summary>Voir le détail du calcul <small>formule par formule</small>' +
          '<span class="aeds__volet-fleche">' + ICONES.chevron + '</span></summary>' +
        '<div class="aeds__enveloppe-tableau">' +
          '<table class="aeds__tableau">' +
            '<caption data-role="legende-tableau"></caption>' +
            '<thead><tr><th scope="col">Étape</th><th scope="col">Montant</th></tr></thead>' +
            '<tbody data-role="corps-tableau"></tbody>' +
          '</table>' +
        '</div>' +
      '</details>' +

      '<footer class="aeds__mention">' +
        '<p><b>Estimation indicative.</b> Ce simulateur ne remplace pas la déclaration en DSN ni ' +
          'l’effectif notifié par l’Urssaf ou la MSA. Il ne couvre ni la fonction publique (FIPHFP) ' +
          'ni le calcul détaillé des accords agréés. Barème appliqué&nbsp;: ' +
          '<span data-role="source-bareme"></span> Code du travail, art. L5212-1 et s., D5212-19 à D5212-28.</p>' +
      '</footer>' +

    '</div>' +
    '</section>' +

    '<div class="aeds__rappel" data-role="rappel" data-visible="false">' +
      '<span><small>Contribution estimée</small><data data-role="rappel-montant">—</data></span>' +
      '<button type="button" class="aeds__bouton aeds__bouton--principal" data-role="cta-mobile" data-emplacement="barre-mobile">' +
        'Être rappelé</button>' +
    '</div>' +

    '<p class="aeds__cache" role="status" data-role="annonce"></p>';
  }

  /* ------------------------------------------------------------------ *
   *  Mesure d'audience — uniquement si le site a déjà un dataLayer (GTM).
   *  Aucune donnée n'est envoyée par le simulateur lui-même.
   * ------------------------------------------------------------------ */

  function suivre(evenement, donnees) {
    if (!window.dataLayer || typeof window.dataLayer.push !== 'function') return;
    var charge = { event: evenement };
    for (var cle in donnees) if (Object.prototype.hasOwnProperty.call(donnees, cle)) charge[cle] = donnees[cle];
    window.dataLayer.push(charge);
  }

  /* ------------------------------------------------------------------ *
   *  Instance
   * ------------------------------------------------------------------ */

  var compteur = 0;

  function init(racine) {
    if (!racine || racine.dataset.aedsPret === '1') return null;
    racine.dataset.aedsPret = '1';

    var prefixe = 'aeds' + (++compteur);
    var annees = MOTEUR.anneesDisponibles();
    var anneeDefaut = parseInt(racine.dataset.annee, 10);
    if (annees.indexOf(anneeDefaut) === -1) anneeDefaut = MOTEUR.ANNEE_PAR_DEFAUT;

    racine.classList.add('aeds');
    racine.innerHTML = gabarit(prefixe, annees, anneeDefaut);

    var el = {};
    Array.prototype.forEach.call(racine.querySelectorAll('[data-role]'), function (n) {
      var cle = n.getAttribute('data-role');
      if (el[cle] === undefined) el[cle] = n;
    });

    var form = el.form;
    var champ = function (suffixe) { return racine.querySelector('#' + prefixe + '-' + suffixe); };

    var champs = {
      effectif: champ('effectif'),
      boeth: champ('boeth'),
      seniors: champ('seniors'),
      externes: champ('externes'),
      achats: champ('achats'),
      depenses: champ('depenses'),
      ecap: champ('ecap'),
      ecapDerogation: champ('ecap-derogation'),
      surcontribution: champ('surcontribution'),
      accord: champ('accord'),
      seuil: champ('seuil')
    };

    var etat = { dernier: null, animation: null, resultatSuivi: false };

    /* -------------------- Lecture du formulaire -------------------- */

    function anneeChoisie() {
      var coche = form.querySelector('input[name="' + prefixe + '-annee"]:checked');
      return coche ? parseInt(coche.value, 10) : anneeDefaut;
    }

    function valeur(input) {
      if (!input || input.value === '') return 0;
      var n = parseFloat(String(input.value).replace(',', '.'));
      return isFinite(n) && n >= 0 ? n : 0;
    }

    function lireSaisie() {
      return {
        annee: anneeChoisie(),
        effectifAssujettissement: valeur(champs.effectif),
        boethInternes: valeur(champs.boeth),
        boethSeniors: valeur(champs.seniors),
        boethExternes: valeur(champs.externes),
        ecapEffectif: valeur(champs.ecap),
        coutMainOeuvreSecteurAdapte: valeur(champs.achats),
        depensesDeductibles: valeur(champs.depenses),
        ecapDerogation: champs.ecapDerogation.checked,
        surcontribution: champs.surcontribution.checked,
        accordAgree: champs.accord.checked,
        franchissementSeuil: champs.seuil.checked
      };
    }

    /* -------------------- Validation ------------------------------- */

    function signaler(input, message) {
      var enveloppe = racine.querySelector('[data-enveloppe="' + input.id + '"]');
      var zone = racine.querySelector('#' + input.id + '-erreur');
      if (!zone) return;
      if (message) {
        zone.innerHTML = ICONES.attention + '<span>' + message + '</span>';
        zone.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        if (enveloppe) enveloppe.classList.add('aeds__saisie--erreur');
      } else {
        zone.hidden = true;
        zone.textContent = '';
        input.removeAttribute('aria-invalid');
        if (enveloppe) enveloppe.classList.remove('aeds__saisie--erreur');
      }
    }

    function valider(saisie) {
      if (champs.effectif.value !== '' && valeur(champs.effectif) <= 0) {
        signaler(champs.effectif, 'Indiquez un effectif supérieur à zéro.');
      } else {
        signaler(champs.effectif, null);
      }

      if (saisie.boethSeniors > saisie.boethInternes && champs.seniors.value !== '') {
        signaler(champs.seniors,
          'Ce nombre ne peut pas dépasser vos ' + fNombre(saisie.boethInternes) + ' salariés en situation de handicap.');
      } else {
        signaler(champs.seniors, null);
      }

      if (saisie.effectifAssujettissement > 0 &&
          saisie.boethInternes > saisie.effectifAssujettissement) {
        signaler(champs.boeth, 'Ce nombre dépasse votre effectif total.');
      } else {
        signaler(champs.boeth, null);
      }

      if (saisie.effectifAssujettissement > 0 && saisie.ecapEffectif > saisie.effectifAssujettissement) {
        signaler(champs.ecap, 'L’effectif ECAP dépasse votre effectif total.');
      } else {
        signaler(champs.ecap, null);
      }
    }

    /* -------------------- Animation du montant ---------------------- */

    var mouvementReduit = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };

    function afficherMontant(noeud, depart, arrivee) {
      if (etat.animation) cancelAnimationFrame(etat.animation);
      if (mouvementReduit.matches || Math.abs(arrivee - depart) < 1) {
        noeud.textContent = fEuros(arrivee);
        return;
      }
      var debut = performance.now();
      var duree = 460;
      (function pas(maintenant) {
        var t = Math.min(1, (maintenant - debut) / duree);
        var e = 1 - Math.pow(1 - t, 3);
        noeud.textContent = fEuros(depart + (arrivee - depart) * e);
        if (t < 1) etat.animation = requestAnimationFrame(pas);
      })(debut);
    }

    /* -------------------- Rendu ------------------------------------- */

    var CTA_TITRE_DEFAUT = 'Allez plus loin avec un expert AlterEos';

    function majBareme(b) {
      el['annee-aide'].textContent = 'Déclaration en ' + b.declaration + ' — ' + b.smicSource +
        ' : ' + fEurosPrecis(b.smicHoraire) + '.';
      el['source-bareme'].textContent = 'année ' + b.annee + ', ' + b.smicSource +
        ' (' + fEurosPrecis(b.smicHoraire) + ').';
    }

    function videPanneau(message) {
      el['sous-titre'].textContent = message;
      el.montant.textContent = '—';
      el.montant.classList.remove('aeds__montant--nul');
      el['montant-note'].textContent = 'Le résultat s’affiche ici, sans e-mail ni inscription.';
      el.opportunite.hidden = true;
      el.detail.hidden = true;
      el['cta-titre'].textContent = CTA_TITRE_DEFAUT;
      el.rappel.setAttribute('data-visible', 'false');
    }

    function rendre(r) {
      var b = r.bareme;
      majBareme(b);
      rendreAlertes(r);

      if (!r.assujetti) {
        videPanneau(r.motifNonAssujettissement === 'franchissement-seuil'
          ? 'Franchissement de seuil : aucune contribution due.'
          : 'En dessous de 20 salariés, aucune contribution n’est due.');
        el.montant.textContent = fEuros(0);
        el.montant.classList.add('aeds__montant--nul');
        el['montant-note'].textContent = 'La déclaration en DSN reste obligatoire chaque année.';
        el['cta-titre'].textContent = 'Un projet de prestation responsable ? Parlons-en';
        etat.dernier = r;
        return;
      }

      /* Montant principal */
      var precedent = etat.dernier ? (etat.dernier.contributionDue || 0) : 0;
      afficherMontant(el.montant, precedent, r.contributionDue);
      el.montant.classList.toggle('aeds__montant--nul', r.contributionDue === 0);

      el['sous-titre'].textContent = 'Au titre de ' + b.annee + ', à verser avec la ' + b.declaration;

      if (r.objectifAtteint) {
        el['montant-note'].innerHTML = 'Vous atteignez le taux d’emploi de 6 % : ' +
          '<b>aucune contribution n’est due</b>.';
      } else if (r.neutralisee) {
        el['montant-note'].innerHTML = 'Sous accord agréé, les ' + fEuros(r.contributionNette) +
          ' calculés financent votre programme d’actions au lieu d’être versés.';
      } else {
        el['montant-note'].innerHTML = 'par an, soit <b>' + fEuros(r.contributionDue / 12) + ' par mois</b>. ' +
          'Votre taux d’emploi&nbsp;: ' + fPourcent(r.tauxEmploiPourcent) + ' pour 6 % attendus.';
      }

      /* L'opportunité : ce qui peut devenir prestation */
      var mobilisable = r.neutralisee ? 0 : r.bascule.part.mobilisable;
      el.opportunite.hidden = mobilisable <= 0;
      if (mobilisable > 0) {
        var achat = mobilisable / b.tauxDeductionSousTraitance;
        el.mobilisable.textContent = fEuros(mobilisable);
        el['opportunite-texte'].textContent = 'En confiant environ ' + fArrondi(achat) +
          ' HT de main-d’œuvre à AlterEos, entreprise adaptée : numérisation, relation client, ' +
          'éditique, e-logistique, industrie ou formation. Des prestations dont vous avez besoin, ' +
          'au lieu d’un versement sans contrepartie.';
        el['cta-titre'].textContent = 'Transformez ' + fEuros(mobilisable) + ' de contribution en prestations utiles';
      } else if (r.contributionDue === 0) {
        el['cta-titre'].textContent = 'Allez plus loin dans vos achats responsables';
      } else {
        el['cta-titre'].textContent = CTA_TITRE_DEFAUT;
      }

      rendreTableau(r);
      el['rappel-montant'].textContent = fEuros(r.contributionDue);

      annoncer(r, mobilisable);
      etat.dernier = r;

      if (!etat.resultatSuivi) {
        etat.resultatSuivi = true;
        suivre('aeds_resultat', {
          aeds_contribution: Math.round(r.contributionDue),
          aeds_mobilisable: Math.round(mobilisable),
          aeds_effectif: r.saisie.effectifAssujettissement
        });
      }
    }

    function annoncer(r, mobilisable) {
      var texte;
      if (r.objectifAtteint) {
        texte = 'Objectif de 6 % atteint, aucune contribution due.';
      } else {
        texte = 'Contribution estimée : ' + fEuros(r.contributionDue) + ' par an. ' +
          (mobilisable > 0 ? 'Jusqu’à ' + fEuros(mobilisable) + ' déductibles en confiant des prestations à AlterEos.' : '');
      }
      el.annonce.textContent = texte;
    }

    function rendreAlertes(r) {
      if (!r.alertes.length) { el.alertes.innerHTML = ''; return; }
      el.alertes.innerHTML = r.alertes.map(function (a) {
        return '<div class="aeds__alerte aeds__alerte--' + a.niveau + '">' +
          (a.niveau === 'attention' ? ICONES.attention : ICONES.info) +
          '<div><b>' + a.titre + '</b><p>' + a.texte + '</p></div></div>';
      }).join('');
    }

    function ligne(libelle, formule, montant, classe) {
      return '<tr' + (classe ? ' class="' + classe + '"' : '') + '>' +
        '<td>' + libelle + (formule ? '<span class="aeds__formule">' + formule + '</span>' : '') + '</td>' +
        '<td>' + montant + '</td></tr>';
    }

    function rendreTableau(r) {
      var b = r.bareme, d = r.deductions, lignes = [];

      lignes.push(ligne('Effectif d’assujettissement', 'Effectif moyen annuel déclaré',
        fNombre(r.saisie.effectifAssujettissement) + ' sal.'));

      lignes.push(ligne('Obligation d’emploi',
        '6 % de ' + fNombre(r.saisie.effectifAssujettissement) + ', arrondis à l’unité inférieure',
        fNombre(r.obligationLegale) + ' unités'));

      lignes.push(ligne('Bénéficiaires décomptés',
        fNombre(r.saisie.boethInternes) + ' salariés' +
        (r.majorationSeniors > 0 ? ' + ' + fNombre(r.majorationSeniors) + ' au titre des 50 ans et plus' : '') +
        (r.saisie.boethExternes > 0 ? ' + ' + fNombre(r.saisie.boethExternes) + ' accueillis' : ''),
        fNombre(r.unitesBeneficiaires) + ' unités'));

      lignes.push(ligne('Taux d’emploi atteint',
        fNombre(r.unitesBeneficiaires) + ' ÷ ' + fNombre(r.saisie.effectifAssujettissement),
        fPourcent(r.tauxEmploiPourcent)));

      lignes.push(ligne('Bénéficiaires manquants', null,
        fNombre(r.beneficiairesManquants) + ' unités', 'aeds__ligne--somme'));

      var natureCoef = r.natureCoefficient === 'surcontribution'
        ? 'coefficient de surcontribution'
        : r.natureCoefficient === 'derogation-ecap'
          ? 'dérogation ECAP ≥ 80 %'
          : 'tranche « ' + r.trancheEffectif + ' »';

      lignes.push(ligne('Contribution brute',
        fNombre(r.beneficiairesManquants) + ' × ' + r.coefficient + ' × ' +
        fEurosPrecis(b.smicHoraire) + ' — ' + natureCoef,
        fEurosPrecis(r.contributionBrute), 'aeds__ligne--somme'));

      if (d.ecap.applique > 0) {
        lignes.push(ligne('Minoration ECAP',
          fNombre(r.saisie.ecapEffectif) + ' × 17 × ' + fEurosPrecis(b.smicHoraire),
          '− ' + fEurosPrecis(d.ecap.applique), 'aeds__ligne--deduction'));
      }

      if (d.sousTraitance.applique > 0 || r.saisie.coutMainOeuvreSecteurAdapte > 0) {
        lignes.push(ligne('Déduction sous-traitance EA / ESAT / TIH',
          '30 % de ' + fEuros(r.saisie.coutMainOeuvreSecteurAdapte) +
          ' — plafond ' + Math.round(d.sousTraitance.tauxPlafond * 100) + ' % de la brute (' +
          fEuros(d.sousTraitance.plafond) + ')' +
          (d.sousTraitance.plafonnee ? ' — <b>plafond atteint</b>' : ''),
          '− ' + fEurosPrecis(d.sousTraitance.applique), 'aeds__ligne--deduction'));
      }

      if (d.depenses.applique > 0 || r.saisie.depensesDeductibles > 0) {
        lignes.push(ligne('Dépenses déductibles',
          'plafond 10 % de la brute (' + fEuros(d.depenses.plafond) + ')' +
          (d.depenses.plafonnee ? ' — <b>plafond atteint</b>' : ''),
          '− ' + fEurosPrecis(d.depenses.applique), 'aeds__ligne--deduction'));
      }

      lignes.push(ligne(r.neutralisee ? 'Contribution nette (neutralisée par l’accord)' : 'Contribution due',
        r.neutralisee
          ? 'Affectée au programme d’actions de l’accord agréé'
          : 'À verser avec la ' + b.declaration,
        fEurosPrecis(r.contributionDue), 'aeds__ligne--totale'));

      el['corps-tableau'].innerHTML = lignes.join('');
      el['legende-tableau'].textContent = 'Barème ' + b.annee + ' — SMIC horaire retenu ' +
        fEurosPrecis(b.smicHoraire) + '. Montants arrondis à l’euro près à l’affichage.';
      el.detail.hidden = false;
    }

    /* -------------------- Actions ----------------------------------- */

    var cibleFormulaire = racine.dataset.formulaireContact || '#contact';
    var cibleMessage = racine.dataset.champMessage || '';
    var cibleEstUrl = /^(https?:)?\/|^\.{0,2}\//.test(cibleFormulaire);

    function resume(r) {
      if (!r || !r.saisie.effectifAssujettissement) {
        return 'Je souhaite échanger sur ma contribution OETH et les prestations d’AlterEos.';
      }
      var mobilisable = r.bascule && !r.neutralisee ? r.bascule.part.mobilisable : 0;
      return 'Simulation OETH ' + r.bareme.annee + ' :\n' +
        '- Effectif : ' + fNombre(r.saisie.effectifAssujettissement) + ' salariés\n' +
        '- Bénéficiaires : ' + fNombre(r.unitesBeneficiaires || 0) + ' unités (' +
          fPourcent(r.tauxEmploiPourcent || 0) + ')\n' +
        '- Contribution estimée : ' + fEuros(r.contributionDue || 0) + ' par an\n' +
        (mobilisable > 0 ? '- Déductible via une prestation : jusqu’à ' + fEuros(mobilisable) + '\n' : '') +
        '\nJe souhaite être rappelé pour vérifier ce calcul et étudier les prestations possibles.';
    }

    function allerAuContact(e) {
      var emplacement = e && e.currentTarget ? e.currentTarget.getAttribute('data-emplacement') : '';
      var r = etat.dernier;
      var texte = resume(r);

      suivre('aeds_cta', {
        aeds_emplacement: emplacement,
        aeds_contribution: r && r.contributionDue ? Math.round(r.contributionDue) : 0
      });

      if (cibleEstUrl) {
        var url = new URL(cibleFormulaire, window.location.href);
        url.searchParams.set('simulation', texte);
        window.location.href = url.toString();
        return;
      }

      var cible = null;
      try { cible = document.querySelector(cibleFormulaire); } catch (err) { cible = null; }

      if (cibleMessage) {
        var zone = null;
        try { zone = document.querySelector(cibleMessage); } catch (err) { zone = null; }
        if (zone && 'value' in zone && !zone.value.trim()) {
          zone.value = texte;
          zone.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      if (cible) {
        cible.scrollIntoView({
          behavior: mouvementReduit.matches ? 'auto' : 'smooth',
          block: 'start'
        });
        var premier = cible.querySelector('input:not([type="hidden"]), select, textarea');
        if (premier) {
          window.setTimeout(function () { premier.focus({ preventScroll: true }); }, 600);
        }
      } else {
        racine.dispatchEvent(new CustomEvent('aeds:contact', {
          bubbles: true,
          detail: { resultat: r, resume: texte }
        }));
      }
    }

    /* -------------------- Recalcul ---------------------------------- */

    function recalculer() {
      var saisie = lireSaisie();
      valider(saisie);

      if (saisie.effectifAssujettissement <= 0) {
        majBareme(MOTEUR.calculer(saisie).bareme);
        el.alertes.innerHTML = '';
        videPanneau('Indiquez votre nombre de salariés.');
        if (etat.animation) cancelAnimationFrame(etat.animation);
        etat.dernier = null;
        return;
      }

      rendre(MOTEUR.calculer(saisie));
    }

    /* -------------------- Écouteurs --------------------------------- */

    form.addEventListener('input', recalculer);
    form.addEventListener('change', recalculer);

    el.cta.addEventListener('click', allerAuContact);
    el['cta-mobile'].addEventListener('click', allerAuContact);

    el.affiner.addEventListener('toggle', function () {
      if (el.affiner.open) suivre('aeds_affiner', {});
    });

    /* Barre de rappel mobile : visible dès que l'appel à l'action sort de l'écran */
    if ('IntersectionObserver' in window) {
      var vigie = new IntersectionObserver(function (entrees) {
        var visible = entrees[0].isIntersecting;
        el.rappel.setAttribute('data-visible',
          (!visible && etat.dernier && etat.dernier.assujetti) ? 'true' : 'false');
      }, { rootMargin: '-80px 0px 0px 0px' });
      vigie.observe(el['cta-bloc']);
    }

    recalculer();

    return {
      racine: racine,
      recalculer: recalculer,
      resultat: function () { return etat.dernier; }
    };
  }

  /* ------------------------------------------------------------------ *
   *  Amorçage
   * ------------------------------------------------------------------ */

  function amorcer() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aeds]'), init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', amorcer);
  } else {
    amorcer();
  }

  window.AlterEosSimulateur = { init: init, amorcer: amorcer };

})(window, document);
