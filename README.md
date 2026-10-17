# Simulateur DOETH / contribution OETH — AlterEos

Calculateur de la contribution annuelle due au titre de l'obligation d'emploi des
travailleurs handicapés, doublé d'un simulateur de la déduction obtenue en confiant
une prestation à une entreprise adaptée.

Vanilla HTML/CSS/JS, aucune dépendance, aucun appel réseau, aucun cookie.

---

## 1. Contenu du dépôt

| Chemin | Rôle |
|---|---|
| `assets/doeth-core.js` | Moteur de calcul pur. Aucun DOM. C'est le seul fichier à toucher quand le barème change. |
| `assets/doeth-simulateur.js` | Interface : gabarit, saisie, validation, rendu, appels à l'action. |
| `assets/doeth-simulateur.css` | Styles, scopés sous `.aeds`. |
| `index.html` | Page de démonstration reproduisant le cadre de la maquette « Calculateur OETH ». |
| `tests/doeth-core.test.mjs` | 23 tests du moteur (`node --test tests/doeth-core.test.mjs`). |
| `wordpress/altereos-simulateur-doeth/` | Plugin WordPress avec shortcode `[altereos_doeth]`. |
| `outils/construire.mjs` | Recopie les assets dans le plugin. À lancer après toute modification. |
| `PRODUCT.md` | Contexte produit, décisions et contraintes. |
| `DESIGN.md` | Système visuel tel que construit. |

---

## 2. Intégration WordPress

```bash
node outils/construire.mjs
```

Puis compressez `wordpress/altereos-simulateur-doeth/` et installez l'archive via
**Extensions → Ajouter → Téléverser**.

Dans la page « Calculateur OETH », à l'endroit où mène le bouton « Lancer la simulation » :

```
[altereos_doeth annee="2026" contact="#contact" message="#form-field-message"]
```

| Attribut | Défaut | Rôle |
|---|---|---|
| `annee` | `2026` | Année de référence présélectionnée. |
| `contact` | `#contact` | Sélecteur CSS du bloc de contact vers lequel renvoient les boutons d'action, **ou URL d'une page contact** (`/contact/`) : le résumé y est passé dans le paramètre `?simulation=`, récupérable par la balise dynamique « Paramètre de requête » d'Elementor Pro. |
| `message` | *(vide)* | Sélecteur CSS du champ « Décrivez votre besoin » à pré-remplir avec le résumé chiffré de la simulation. |
| `classe` | *(vide)* | Classes CSS additionnelles. |

Le bouton « Lancer la simulation » de la maquette doit pointer vers l'ancre de la
section, par exemple `href="#simulateur"` avec `[altereos_doeth]` placé dans un bloc
dont l'ancre HTML est `simulateur`.

**Formulaire Elementor / Gravity Forms** — repérez l'`id` réel du champ message
(inspecteur du navigateur) et passez-le dans `message`. Si aucun formulaire n'est
trouvé, le simulateur émet à la place un évènement DOM `aeds:contact` sur son
conteneur, dont le `detail` porte le résultat complet et le résumé texte : de quoi
brancher un CRM ou une modale maison.

```js
document.addEventListener('aeds:contact', (e) => {
  console.log(e.detail.resume, e.detail.resultat.contributionDue);
});
```

**Mesure d'audience** — si le site charge Google Tag Manager (`window.dataLayer`), le
simulateur y pousse trois évènements, sans aucun appel réseau de son côté :
`aeds_resultat` (premier résultat affiché : contribution, montant déductible, effectif),
`aeds_affiner` (ouverture du volet facultatif) et `aeds_cta` (clic sur l'appel à l'action,
avec son emplacement `panneau` ou `barre-mobile`). À déclarer en conversions dans GA4.

Les polices (Poppins pour les titres, Lato pour le texte) sont celles déjà servies
par le thème. Si ce n'est plus le cas après la refonte :

```php
add_filter( 'altereos_doeth_charger_polices', '__return_true' );
```

---

## 3. Règles de calcul appliquées

Barème vérifié le 5 août 2026. Sources : code du travail art. L5212-1 et suivants et
D5212-19 à D5212-28, [Agefiph](https://www.agefiph.fr/centre-aide/calcul-de-la-contribution-oeth),
[Urssaf](https://www.urssaf.fr/accueil/employeur/cotisations/liste-cotisations/contribution-annuelle-oeth.html),
[service-public entreprendre](https://entreprendre.service-public.gouv.fr/vosdroits/R16996).

### Assujettissement

- 20 salariés et plus (effectif moyen annuel d'assujettissement, notifié par
  l'Urssaf ou la MSA au plus tard le 15 mars).
- Le franchissement du seuil de 20 salariés suspend la contribution pendant 5 ans.

### Unités bénéficiaires

```
unités = bénéficiaires salariés
       + 0,5 × bénéficiaires de 50 ans et plus   (ils comptent pour 1,5)
       + bénéficiaires accueillis                (intérim, mise à disposition,
                                                  stagiaires, PMSMP)
```

La limite de 2 % qui s'appliquait aux stagiaires et PMSMP a disparu.

### Contribution brute

```
obligation  = plancher(6 % × effectif d'assujettissement)
manquants   = max(0 ; obligation − unités)
brute       = manquants × coefficient × SMIC horaire au 31/12
```

| Effectif | Coefficient |
|---|---|
| 20 à 249 | 400 |
| 250 à 749 | 500 |
| 750 et plus | 600 |
| Surcontribution | 1 500 |
| Établissement dont l'effectif ECAP ≥ 80 % | 40 |

**Surcontribution** : aucune action en faveur de l'emploi des personnes handicapées
sur plus de 3 années consécutives — ni bénéficiaire employé, ni contrat au secteur
adapté d'au moins 600 fois le SMIC sur 4 ans, ni accord agréé.

### Déductions, dans cet ordre

1. **Minoration ECAP** = effectif ECAP × 17 × SMIC horaire. Non cumulable avec la
   dérogation à 40.
2. **Sous-traitance EA / ESAT / TIH / EPS** = 30 % du coût de la main-d'œuvre
   (prix HT diminué des matières premières, produits, matériaux, consommations
   intermédiaires, frais de vente et de commercialisation — le « montant 3 » de
   l'attestation du prestataire).
   Plafond : **50 %** de la contribution brute, porté à **75 %** si le taux d'emploi
   atteint 3 %.
3. **Dépenses déductibles** (accessibilité, maintien dans l'emploi, accompagnement,
   partenariats associatifs) : plafond de **10 %** de la contribution brute.

La contribution nette ne peut pas devenir négative. Sous accord agréé, la
contribution due est nulle : elle finance le programme d'actions de l'accord.

### Écrêtement

Supprimé depuis le 1ᵉʳ janvier 2025. Aucun abattement n'est appliqué.

### SMIC de référence

| Année déclarée | SMIC horaire retenu | Statut |
|---|---|---|
| 2025 (déclarée en mai 2026) | 11,88 € | définitif — pas de revalorisation en 2025 |
| 2026 (déclarée en mai 2027) | 12,31 € | **provisoire** — valeur du 1ᵉʳ juin 2026 |

---

## 4. Mise à jour annuelle

Tout tient dans l'objet `BAREME` en tête de `assets/doeth-core.js`.

1. Vérifier le SMIC horaire brut au 31 décembre de l'année écoulée. S'il a changé,
   corriger `smicHoraire` et basculer `smicProvisoire` à `false`.
2. Ajouter l'entrée de l'année suivante en dupliquant la précédente.
3. Lancer les tests : `node --test tests/doeth-core.test.mjs`.
4. Relancer `node outils/construire.mjs` et redéployer le plugin.

Points à surveiller d'une campagne à l'autre : les catégories de dépenses
déductibles temporaires (celle relative aux partenariats associatifs court jusqu'au
31/12/2029), et les plafonds 50 % / 75 % de la déduction sous-traitance.

---

## 5. Accessibilité

Conçu pour le RGAA 4 / WCAG 2.1 AA — c'est une exigence de fond pour une entreprise
adaptée, pas une option.

- Formulaire natif : `<fieldset>`/`<legend>`, `<label>` explicites, aides reliées par
  `aria-describedby`, erreurs annoncées via `aria-invalid`.
- Résultats annoncés aux lecteurs d'écran par une région `role="status"` concise —
  pas de verbiage à chaque frappe.
- La barre de répartition porte `role="img"` et une description chiffrée complète ;
  ses trois parts se distinguent aussi par leur motif (plein, hachuré) et par le
  texte de la légende, jamais par la seule couleur.
- Contrastes vérifiés : texte courant ≥ 5:1, textes secondaires ≥ 5:1.
- Curseur pilotable au clavier, avec `aria-valuetext` en langage naturel.
- `prefers-reduced-motion` neutralise l'animation du montant et des parts.
- Mode contraste forcé de Windows pris en charge.
- Rendu imprimable : le détail du calcul se conserve en PDF sans les éléments
  interactifs.

---

## 6. Limites assumées

- Estimation indicative : ne remplace ni la DSN ni l'effectif notifié par l'Urssaf.
- Ne couvre pas la fonction publique (FIPHFP).
- Ne calcule pas le budget minimum d'un accord agréé.
- Ne reconstitue pas l'effectif moyen annuel mois par mois : c'est l'Urssaf qui le
  notifie, il est saisi tel quel.
- Le taux d'emploi qui déclenche le plafond à 75 % est calculé à partir des unités
  bénéficiaires internes et externes, majoration seniors comprise.

---

## 7. Développement

```bash
node --test tests/doeth-core.test.mjs   # 23 tests du moteur
node outils/construire.mjs              # assemble le plugin
```

Ouvrir `index.html` directement dans un navigateur suffit pour travailler
l'interface : aucun serveur n'est nécessaire.
