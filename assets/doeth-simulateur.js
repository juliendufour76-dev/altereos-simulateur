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
    balance: icone('<path d="M12 4v16M7 20h10M6 8h12M6 8l-3 6h6zM18 8l3 6h-6z"/>'),
    info: icone('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
    attention: icone('<path d="M10.3 4.3 2.6 17.5A1.9 1.9 0 0 0 4.3 20.4h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 4.3a1.9 1.9 0 0 0-3.4 0Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'),
    fleche: icone('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    chevron: icone('<path d="m6 9 6 6 6-6"/>', 20),
    imprimer: icone('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>'),
    croix: icone('<path d="M18 6 6 18M6 6l12 12"/>', 14)
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
        '<div class="aeds__saisie" data-enveloppe="' + id + '">' +
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
        '<h2 class="aeds__titre" id="' + prefixe + '-titre">Estimez votre contribution, et ce que vous pouvez en faire</h2>' +
        '<p class="aeds__chapo">Renseignez trois chiffres. Le simulateur applique le barème officiel, ' +
          'affiche le montant dû et la part que vous pouvez transformer en prestation.</p>' +
        '<ul class="aeds__meta">' +
          '<li>' + ICONES.horloge + 'Résultat immédiat, sans inscription</li>' +
          '<li>' + ICONES.bouclier + 'Barème Urssaf / Agefiph en vigueur</li>' +
          '<li>' + ICONES.balance + 'Chaque ligne de calcul est détaillée</li>' +
        '</ul>' +
      '</header>' +

      '<div class="aeds__atelier">' +

        /* ---------- Colonne saisie ---------- */
        '<form class="aeds__form" novalidate data-role="form">' +

          '<fieldset class="aeds__bloc">' +
            '<legend class="aeds__legende">Votre effectif</legend>' +
            '<span class="aeds__legende-note">Les chiffres de l’année sur laquelle porte la déclaration.</span>' +
            '<div class="aeds__champs">' +
              '<div class="aeds__champ">' +
                '<span class="aeds__label" id="' + prefixe + '-annee-label">Année de référence</span>' +
                '<p class="aeds__aide" id="' + prefixe + '-annee-aide" data-role="annee-aide"></p>' +
                '<div class="aeds__segments" role="radiogroup" ' +
                  'aria-labelledby="' + prefixe + '-annee-label" ' +
                  'aria-describedby="' + prefixe + '-annee-aide">' + segments + '</div>' +
              '</div>' +
              champNombre(prefixe + '-effectif', 'Effectif d’assujettissement',
                'Effectif moyen annuel notifié par l’Urssaf ou la MSA au plus tard le 15 mars. ' +
                'Apprentis, alternants, stagiaires et intérimaires en sont exclus.',
                { unite: 'salariés', placeholder: 'ex. 240', decimal: true, step: 0.01 }) +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="aeds__bloc">' +
            '<legend class="aeds__legende">Vos bénéficiaires</legend>' +
            '<span class="aeds__legende-note">Personnes reconnues bénéficiaires de l’obligation d’emploi (RQTH, ' +
              'invalidité, AAH, pension militaire…).</span>' +
            '<div class="aeds__champs aeds__champs--duo">' +
              champNombre(prefixe + '-boeth', 'Bénéficiaires salariés',
                'Effectif moyen annuel, tous contrats confondus.',
                { unite: 'pers.', decimal: true, step: 0.01 }) +
              champNombre(prefixe + '-seniors', 'Dont 50 ans et plus',
                'Chacun compte pour 1,5 unité.',
                { unite: 'pers.', decimal: true, step: 0.01 }) +
            '</div>' +
            '<div class="aeds__champs" style="margin-top:1rem">' +
              champNombre(prefixe + '-externes', 'Bénéficiaires accueillis',
                'Intérimaires, salariés mis à disposition, stagiaires et PMSMP.',
                { unite: 'pers.', decimal: true, step: 0.01 }) +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="aeds__bloc">' +
            '<legend class="aeds__legende">Vos achats et dépenses</legend>' +
            '<span class="aeds__legende-note">Montants hors taxes acquittés sur l’année déclarée.</span>' +
            '<div class="aeds__champs">' +
              champNombre(prefixe + '-achats', 'Achats au secteur adapté et protégé',
                'Coût de la main-d’œuvre facturé par une entreprise adaptée (EA), un ESAT, ' +
                'un travailleur indépendant handicapé ou une entreprise de portage. ' +
                'Il figure sur l’attestation annuelle de votre prestataire.',
                { unite: '€ HT', placeholder: 'ex. 40 000', step: 100 }) +
              champNombre(prefixe + '-depenses', 'Dépenses déductibles',
                'Accessibilité, maintien dans l’emploi, accompagnement, partenariats. ' +
                'Retenues dans la limite de 10 % de la contribution brute.',
                { unite: '€ HT', step: 100 }) +
            '</div>' +
          '</fieldset>' +

          '<details class="aeds__volet">' +
            '<summary>Situations particulières <small>ECAP, accord agréé, seuil</small>' +
              '<span class="aeds__volet-fleche">' + ICONES.chevron + '</span></summary>' +
            '<div class="aeds__volet-corps">' +
              '<div class="aeds__champs">' +
                champNombre(prefixe + '-ecap', 'Salariés sur un emploi ECAP',
                  'Emplois exigeant des conditions d’aptitude particulières (conduite, sécurité, ' +
                  'certains postes du BTP…). Ils ouvrent droit à une minoration.',
                  { unite: 'pers.', decimal: true, step: 0.01 }) +
              '</div>' +
              '<div class="aeds__coches">' +
                coche(prefixe + '-ecap-derogation', 'Établissement dont l’effectif ECAP atteint 80 %',
                  'Le coefficient tombe alors à 40 fois le SMIC horaire.') +
                coche(prefixe + '-surcontribution', 'Aucune action en faveur de l’emploi des personnes handicapées depuis plus de 3 ans',
                  'Ni bénéficiaire employé, ni contrat au secteur adapté d’au moins 600 fois le SMIC, ni accord agréé.') +
                coche(prefixe + '-accord', 'Accord agréé en cours d’application',
                  'La contribution finance le programme d’actions de l’accord au lieu d’être versée.') +
                coche(prefixe + '-seuil', 'Seuil de 20 salariés franchi il y a moins de 5 ans',
                  'Le franchissement de seuil suspend la contribution pendant 5 ans.') +
              '</div>' +
            '</div>' +
          '</details>' +

        '</form>' +

        /* ---------- Colonne résultat ---------- */
        '<div class="aeds__resultat">' +
          '<div class="aeds__panneau">' +

            '<div class="aeds__panneau-tete">' +
              '<h3 class="aeds__panneau-titre">Contribution estimée</h3>' +
              '<p class="aeds__panneau-sous" data-role="sous-titre">Renseignez votre effectif pour lancer le calcul.</p>' +
              '<strong class="aeds__montant" data-role="montant">—</strong>' +
              '<p class="aeds__montant-note" data-role="montant-note">Le résultat s’affiche ici, sans e-mail ni inscription.</p>' +
            '</div>' +

            '<div class="aeds__masse" data-role="masse" hidden>' +
              '<div class="aeds__masse-entete">' +
                '<span>Répartition de la contribution brute</span>' +
                '<b data-role="brute">—</b>' +
              '</div>' +
              '<div class="aeds__barre" role="img" data-role="barre" aria-label="">' +
                '<div class="aeds__part aeds__part--du" data-role="part-du"></div>' +
                '<div class="aeds__part aeds__part--mobilisable" data-role="part-mobilisable"></div>' +
                '<div class="aeds__part aeds__part--deduit" data-role="part-deduit"></div>' +
              '</div>' +
              '<ul class="aeds__legende-masse">' +
                '<li class="aeds__ligne-legende">' +
                  '<span class="aeds__pastille aeds__pastille--du"></span>' +
                  '<span><b>Reste dû à l’Urssaf</b>' +
                    '<span class="aeds__legende-detail">Versé avec la DSN, sans contrepartie.</span></span>' +
                  '<data data-role="valeur-du">—</data>' +
                '</li>' +
                '<li class="aeds__ligne-legende" data-role="ligne-mobilisable">' +
                  '<span class="aeds__pastille aeds__pastille--mobilisable"></span>' +
                  '<span><b>Encore transformable</b>' +
                    '<span class="aeds__legende-detail" data-role="detail-mobilisable"></span></span>' +
                  '<data data-role="valeur-mobilisable">—</data>' +
                '</li>' +
                '<li class="aeds__ligne-legende" data-role="ligne-deduit">' +
                  '<span class="aeds__pastille aeds__pastille--deduit"></span>' +
                  '<span><b>Déjà déduit</b>' +
                    '<span class="aeds__legende-detail">Sous-traitance, ECAP et dépenses déductibles.</span></span>' +
                  '<data data-role="valeur-deduit">—</data>' +
                '</li>' +
              '</ul>' +
            '</div>' +

            '<div class="aeds__curseur" data-role="curseur-bloc" hidden>' +
              '<h4 class="aeds__curseur-titre">Et si vous confiiez une prestation à AlterEos ?</h4>' +
              '<p class="aeds__curseur-note">Déplacez le curseur : 30 % du coût de main-d’œuvre facturé ' +
                'vient en déduction de votre contribution.</p>' +
              '<label class="aeds__cache" for="' + prefixe + '-curseur">Montant de prestation confié au secteur adapté</label>' +
              '<input type="range" id="' + prefixe + '-curseur" data-role="curseur" ' +
                'min="0" max="100000" step="500" value="0">' +
              '<div class="aeds__curseur-sortie">' +
                '<span>Prestation confiée<output for="' + prefixe + '-curseur" data-role="curseur-valeur">0 €</output></span>' +
                '<span class="aeds__gain" data-role="curseur-gain"></span>' +
              '</div>' +
            '</div>' +

            '<div class="aeds__panneau-pied">' +
              '<button type="button" class="aeds__bouton aeds__bouton--principal" data-role="cta" disabled>' +
                'Faire vérifier mon estimation' + ICONES.fleche + '</button>' +
              '<button type="button" class="aeds__bouton aeds__bouton--fantome" data-role="impression">' +
                ICONES.imprimer + 'Imprimer ou enregistrer en PDF</button>' +
              '<p class="aeds__pied-note">Un échange de 30 minutes avec notre équipe, sans engagement.</p>' +
            '</div>' +

          '</div>' +

          '<div class="aeds__alertes" data-role="alertes"></div>' +
        '</div>' +

      '</div>' +

      /* ---------- Détail ---------- */
      '<div class="aeds__detail" data-role="detail" hidden>' +
        '<h3 class="aeds__section-titre">Le détail du calcul</h3>' +
        '<p class="aeds__section-note">Chaque ligne indique la formule appliquée. Vous pouvez la reprendre ' +
          'telle quelle pour contrôler la déclaration établie par votre service paie.</p>' +
        '<div class="aeds__enveloppe-tableau">' +
          '<table class="aeds__tableau">' +
            '<caption data-role="legende-tableau"></caption>' +
            '<thead><tr><th scope="col">Étape</th><th scope="col">Montant</th></tr></thead>' +
            '<tbody data-role="corps-tableau"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* ---------- Levier ---------- */
      '<div class="aeds__levier" data-role="levier" hidden>' +
        '<h3 class="aeds__section-titre">Ce que vous pouvez encore transformer</h3>' +
        '<p class="aeds__section-note">AlterEos est une entreprise adaptée : les prestations que vous nous ' +
          'confiez sont produites par des équipes majoritairement composées de personnes en situation de ' +
          'handicap, et 30 % du coût de main-d’œuvre se déduit de votre contribution.</p>' +
        '<div class="aeds__levier-grille">' +
          '<div class="aeds__levier-item">' +
            '<span class="aeds__levier-chiffre" data-role="levier-marge">—</span>' +
            '<h3>de déduction encore disponible</h3>' +
            '<p data-role="levier-marge-note"></p>' +
          '</div>' +
          '<div class="aeds__levier-item">' +
            '<span class="aeds__levier-chiffre" data-role="levier-achat">—</span>' +
            '<h3>de prestation à confier</h3>' +
            '<p>C’est le volume de main-d’œuvre qui sature votre plafond de déduction. ' +
              'Répartissable sur plusieurs prestations et plusieurs sites.</p>' +
          '</div>' +
          '<div class="aeds__levier-item">' +
            '<span class="aeds__levier-chiffre" data-role="levier-embauche">—</span>' +
            '<h3>par unité bénéficiaire employée</h3>' +
            '<p>Chaque recrutement d’une personne bénéficiaire réduit d’autant la contribution, ' +
              'en plus des aides à l’embauche mobilisables.</p>' +
          '</div>' +
        '</div>' +
        '<ul class="aeds__poles">' +
          '<li class="aeds__pole">Numérisation et GED</li>' +
          '<li class="aeds__pole">Relation client</li>' +
          '<li class="aeds__pole">Éditique</li>' +
          '<li class="aeds__pole">Prestations industrielles</li>' +
          '<li class="aeds__pole">E-logistique</li>' +
          '<li class="aeds__pole">Formation</li>' +
        '</ul>' +
        '<div class="aeds__levier-action">' +
          '<button type="button" class="aeds__bouton aeds__bouton--principal" data-role="cta-bas">' +
            'Discuter de mon projet' + ICONES.fleche + '</button>' +
        '</div>' +
      '</div>' +

      '<footer class="aeds__mention">' +
        '<p><b>Estimation indicative.</b> Ce simulateur ne remplace pas la déclaration en DSN ni ' +
          'l’effectif d’assujettissement notifié par l’Urssaf ou la MSA. Il ne couvre ni la fonction ' +
          'publique (FIPHFP) ni le calcul détaillé des accords agréés.</p>' +
        '<ul>' +
          '<li>Code du travail, articles L5212-1 et suivants, D5212-19 à D5212-28.</li>' +
          '<li>Barème appliqué&nbsp;: <span data-role="source-bareme"></span></li>' +
          '<li>Depuis le 1<sup>er</sup> janvier 2025, l’écrêtement transitoire des hausses de ' +
            'contribution ne s’applique plus.</li>' +
        '</ul>' +
      '</footer>' +

    '</div>' +
    '</section>' +

    '<div class="aeds__rappel" data-role="rappel" data-visible="false">' +
      '<span><small>Contribution estimée</small><data data-role="rappel-montant">—</data></span>' +
      '<button type="button" class="aeds__bouton aeds__bouton--principal" data-role="cta-mobile">' +
        'En parler</button>' +
    '</div>' +

    '<p class="aeds__cache" role="status" data-role="annonce"></p>';
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

    var etat = { dernier: null, curseurActif: false, animation: null };

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
      var ok = true;

      if (champs.effectif.value !== '' && valeur(champs.effectif) <= 0) {
        signaler(champs.effectif, 'Indiquez un effectif supérieur à zéro.');
        ok = false;
      } else {
        signaler(champs.effectif, null);
      }

      if (saisie.boethSeniors > saisie.boethInternes && champs.seniors.value !== '') {
        signaler(champs.seniors,
          'Ce nombre ne peut pas dépasser vos ' + fNombre(saisie.boethInternes) + ' bénéficiaires salariés.');
      } else {
        signaler(champs.seniors, null);
      }

      if (saisie.effectifAssujettissement > 0 &&
          saisie.boethInternes > saisie.effectifAssujettissement) {
        signaler(champs.boeth, 'Vos bénéficiaires salariés dépassent votre effectif total.');
        ok = false;
      } else {
        signaler(champs.boeth, null);
      }

      if (saisie.effectifAssujettissement > 0 && saisie.ecapEffectif > saisie.effectifAssujettissement) {
        signaler(champs.ecap, 'L’effectif ECAP dépasse votre effectif total.');
      } else {
        signaler(champs.ecap, null);
      }

      return ok;
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

    function videPanneau(message) {
      el['sous-titre'].textContent = message;
      el.montant.textContent = '—';
      el.montant.classList.remove('aeds__montant--nul');
      el['montant-note'].textContent = 'Le résultat s’affiche ici, sans e-mail ni inscription.';
      el.masse.hidden = true;
      el['curseur-bloc'].hidden = true;
      el.detail.hidden = true;
      el.levier.hidden = true;
      el.cta.disabled = true;
      el.rappel.setAttribute('data-visible', 'false');
    }

    function rendre(r) {
      var b = r.bareme;
      el['annee-aide'].textContent = 'Déclaration en ' + b.declaration.replace('DSN d’avril ', 'DSN d’avril ') +
        ' — ' + b.smicSource + ' : ' + fEurosPrecis(b.smicHoraire) + '.';
      el['source-bareme'].textContent = 'année ' + b.annee + ', ' + b.smicSource +
        ' (' + fEurosPrecis(b.smicHoraire) + ').';

      rendreAlertes(r);

      if (!r.assujetti) {
        videPanneau(r.motifNonAssujettissement === 'franchissement-seuil'
          ? 'Franchissement de seuil : aucune contribution due.'
          : 'En dessous de 20 salariés, aucune contribution n’est due.');
        el.montant.textContent = fEuros(0);
        el.montant.classList.add('aeds__montant--nul');
        el['montant-note'].textContent = 'La déclaration en DSN reste obligatoire chaque année.';
        return;
      }

      if (r.saisie.effectifAssujettissement <= 0) {
        videPanneau('Renseignez votre effectif pour lancer le calcul.');
        return;
      }

      /* Montant principal */
      var precedent = etat.dernier ? etat.dernier.contributionDue : 0;
      afficherMontant(el.montant, precedent, r.contributionDue);
      el.montant.classList.toggle('aeds__montant--nul', r.contributionDue === 0);

      el['sous-titre'].textContent = 'Au titre de ' + b.annee + ' — ' + b.declaration;

      if (r.objectifAtteint) {
        el['montant-note'].innerHTML = 'Vous atteignez le taux d’emploi de 6 % : ' +
          '<b>aucune contribution n’est due</b>. La déclaration reste obligatoire.';
      } else if (r.neutralisee) {
        el['montant-note'].innerHTML = 'Sous accord agréé, les ' + fEuros(r.contributionNette) +
          ' calculés financent votre programme d’actions au lieu d’être versés.';
      } else {
        el['montant-note'].innerHTML = 'Soit <b>' + fEuros(r.contributionDue / 12) + ' par mois</b>. ' +
          'Taux d’emploi actuel : ' + fPourcent(r.tauxEmploiPourcent) + ' pour une obligation de 6 %.';
      }

      /* La masse */
      var base = r.contributionBrute;
      el.masse.hidden = base <= 0;
      if (base > 0) {
        var parts = r.bascule.part;
        var pc = function (v) { return Math.max(0, (v / base) * 100); };
        el['part-du'].style.width = pc(parts.duIrreductible) + '%';
        el['part-mobilisable'].style.width = pc(parts.mobilisable) + '%';
        el['part-deduit'].style.width = pc(parts.deduit) + '%';

        el.brute.textContent = fEuros(base);
        el['valeur-du'].textContent = fEuros(parts.duIrreductible);
        el['valeur-mobilisable'].textContent = fEuros(parts.mobilisable);
        el['valeur-deduit'].textContent = fEuros(parts.deduit);

        el['detail-mobilisable'].textContent = 'Convertible en prestation, dans la limite de ' +
          Math.round(r.levier.tauxPlafond * 100) + ' % de la contribution brute.';

        el['ligne-mobilisable'].hidden = parts.mobilisable <= 0;
        el['ligne-deduit'].hidden = parts.deduit <= 0;

        el.barre.setAttribute('aria-label',
          'Répartition de ' + fEuros(base) + ' de contribution brute : ' +
          fEuros(parts.duIrreductible) + ' restent dus, ' +
          fEuros(parts.mobilisable) + ' sont encore transformables en prestation, ' +
          fEuros(parts.deduit) + ' sont déjà déduits.');
      }

      /* Curseur */
      var afficherCurseur = base > 0 && !r.neutralisee;
      el['curseur-bloc'].hidden = !afficherCurseur;
      if (afficherCurseur && !etat.curseurActif) {
        var plancher = Math.max(
          20000,
          Math.ceil((r.levier.achatsPourSaturerPlafond * 1.35) / 5000) * 5000,
          Math.ceil((r.saisie.coutMainOeuvreSecteurAdapte * 1.5) / 5000) * 5000
        );
        el.curseur.max = plancher;
        el.curseur.step = Math.max(500, Math.round(plancher / 200 / 500) * 500);
        el.curseur.value = r.saisie.coutMainOeuvreSecteurAdapte;
        majCurseur(r.saisie.coutMainOeuvreSecteurAdapte, r);
      }

      /* Détail et levier */
      rendreTableau(r);
      rendreLevier(r);

      el.cta.disabled = false;
      el['rappel-montant'].textContent = fEuros(r.contributionDue);

      annoncer(r);
      etat.dernier = r;
    }

    function annoncer(r) {
      var texte;
      if (r.objectifAtteint) {
        texte = 'Objectif de 6 % atteint, aucune contribution due.';
      } else {
        texte = 'Contribution estimée : ' + fEuros(r.contributionDue) + '. ' +
          'Contribution brute ' + fEuros(r.contributionBrute) + ', ' +
          'déductions ' + fEuros(r.deductions.total) + '. ' +
          (r.levier.margeDeduction > 0
            ? fEuros(r.levier.margeDeduction) + ' sont encore transformables en prestation.'
            : '');
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

    function rendreLevier(r) {
      var afficher = r.contributionBrute > 0 && !r.neutralisee && r.levier.margeDeduction > 0;
      el.levier.hidden = !afficher;
      if (!afficher) return;

      el['levier-marge'].textContent = fEuros(r.levier.margeDeduction);
      el['levier-achat'].textContent = fEuros(r.levier.achatsPourSaturerPlafond);
      el['levier-embauche'].textContent = fEuros(r.levier.economieParEmbauche);

      el['levier-marge-note'].textContent = r.levier.gainSiPlafondHaut > 0
        ? 'Votre plafond est de 50 % car votre taux d’emploi direct est inférieur à 3 %. ' +
          'Le franchir porterait le plafond à 75 %, soit ' + fEuros(r.levier.gainSiPlafondHaut) +
          ' de déduction supplémentaire.'
        : 'Votre taux d’emploi direct atteint 3 % : votre plafond de déduction est de 75 % ' +
          'de la contribution brute.';
    }

    /* -------------------- Curseur ----------------------------------- */

    function majCurseur(montant, reference) {
      var r = reference || etat.dernier;
      if (!r) return;
      var simule = MOTEUR.simulerAchat(r.saisie, montant);
      var progression = el.curseur.max > 0 ? (montant / el.curseur.max) * 100 : 0;
      el.curseur.style.setProperty('--aeds-progression', progression + '%');
      el['curseur-valeur'].textContent = fEuros(montant) + ' HT';
      el.curseur.setAttribute('aria-valuetext',
        fEuros(montant) + ' de prestation, soit une contribution de ' + fEuros(simule.contributionDue));

      var gain = r.contributionDue - simule.contributionDue;
      el['curseur-gain'].textContent = gain > 0
        ? '− ' + fEuros(gain) + ' de contribution'
        : 'Déplacez pour voir l’effet';
      return simule;
    }

    /* -------------------- Actions ----------------------------------- */

    var cibleFormulaire = racine.dataset.formulaireContact || '#contact';
    var cibleMessage = racine.dataset.champMessage || '';

    function resume(r) {
      if (!r) return '';
      return 'Simulation DOETH ' + r.bareme.annee + ' :\n' +
        '- Effectif d’assujettissement : ' + fNombre(r.saisie.effectifAssujettissement) + ' salariés\n' +
        '- Bénéficiaires décomptés : ' + fNombre(r.unitesBeneficiaires) + ' unités (' +
          fPourcent(r.tauxEmploiPourcent) + ')\n' +
        '- Contribution brute : ' + fEuros(r.contributionBrute) + '\n' +
        '- Déductions appliquées : ' + fEuros(r.deductions.total) + '\n' +
        '- Contribution estimée : ' + fEuros(r.contributionDue) + '\n' +
        '- Déduction encore mobilisable : ' + fEuros(r.levier.margeDeduction) +
          ' (soit ' + fEuros(r.levier.achatsPourSaturerPlafond) + ' de prestation à confier)\n\n' +
        'Je souhaite être recontacté pour en discuter.';
    }

    function allerAuContact() {
      var cible = cibleFormulaire ? document.querySelector(cibleFormulaire) : null;

      if (cibleMessage) {
        var zone = document.querySelector(cibleMessage);
        if (zone && 'value' in zone && !zone.value.trim()) {
          zone.value = resume(etat.dernier);
          zone.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      if (cible) {
        cible.scrollIntoView({
          behavior: mouvementReduit.matches ? 'auto' : 'smooth',
          block: 'start'
        });
        var premier = cible.querySelector('input, select, textarea');
        if (premier) {
          window.setTimeout(function () { premier.focus({ preventScroll: true }); }, 600);
        }
      } else {
        racine.dispatchEvent(new CustomEvent('aeds:contact', {
          bubbles: true,
          detail: { resultat: etat.dernier, resume: resume(etat.dernier) }
        }));
      }
    }

    /* -------------------- Recalcul ---------------------------------- */

    function recalculer() {
      var saisie = lireSaisie();
      valider(saisie);

      if (saisie.effectifAssujettissement <= 0) {
        var vide = MOTEUR.calculer(saisie);
        el['annee-aide'].textContent = 'Déclaration en ' + vide.bareme.declaration +
          ' — ' + vide.bareme.smicSource + ' : ' + fEurosPrecis(vide.bareme.smicHoraire) + '.';
        el['source-bareme'].textContent = 'année ' + vide.bareme.annee + ', ' +
          vide.bareme.smicSource + ' (' + fEurosPrecis(vide.bareme.smicHoraire) + ').';
        el.alertes.innerHTML = '';
        videPanneau('Renseignez votre effectif pour lancer le calcul.');
        etat.dernier = null;
        return;
      }

      var r = MOTEUR.calculer(saisie);
      rendre(r);
    }

    /* -------------------- Écouteurs --------------------------------- */

    form.addEventListener('input', function (e) {
      if (e.target === el.curseur) return;
      etat.curseurActif = false;
      recalculer();
    });
    form.addEventListener('change', function () {
      etat.curseurActif = false;
      recalculer();
    });

    el.curseur.addEventListener('input', function () {
      etat.curseurActif = true;
      var montant = parseFloat(el.curseur.value) || 0;
      var simule = majCurseur(montant);
      if (simule) {
        afficherMontant(el.montant, etat.dernier.contributionDue, simule.contributionDue);
        el['rappel-montant'].textContent = fEuros(simule.contributionDue);
      }
    });

    el.curseur.addEventListener('change', function () {
      // Le curseur reporte sa valeur dans le formulaire : une seule source de vérité.
      champs.achats.value = el.curseur.value;
      etat.curseurActif = true;
      var conserve = el.curseur.value;
      recalculer();
      el.curseur.value = conserve;
      majCurseur(parseFloat(conserve) || 0);
      el.annonce.textContent = 'Achats au secteur adapté mis à jour : ' +
        fEuros(parseFloat(conserve) || 0) + '. Contribution estimée : ' +
        fEuros(etat.dernier ? etat.dernier.contributionDue : 0) + '.';
    });

    el.cta.addEventListener('click', allerAuContact);
    el['cta-bas'].addEventListener('click', allerAuContact);
    el['cta-mobile'].addEventListener('click', allerAuContact);
    el.impression.addEventListener('click', function () { window.print(); });

    /* Barre de rappel mobile : visible dès que le panneau sort de l'écran */
    if ('IntersectionObserver' in window) {
      var vigie = new IntersectionObserver(function (entrees) {
        var visible = entrees[0].isIntersecting;
        el.rappel.setAttribute('data-visible',
          (!visible && etat.dernier && etat.dernier.contributionDue >= 0 && !el.cta.disabled)
            ? 'true' : 'false');
      }, { rootMargin: '-80px 0px 0px 0px' });
      vigie.observe(el['panneau-pied']);
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
