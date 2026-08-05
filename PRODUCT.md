# PRODUCT.md — Simulateur DOETH / contribution OETH (AlterEos)

## Le produit

AlterEos est une **entreprise adaptée** (SCIC, agrément ESUS) basée à Tourcoing, fondée en 1991.
Elle emploie majoritairement des personnes en situation de handicap et vend des prestations
B2B : numérisation/indexation, centre de relations clients, éditique, formation, industrie,
e-logistique.

Le simulateur est une page du site refondu (WordPress). Il calcule la **contribution annuelle
OETH** due par une entreprise assujettie (≥ 20 salariés) qui n'atteint pas 6 % de bénéficiaires
de l'obligation d'emploi, puis chiffre **la part de cette contribution qu'un contrat de
sous-traitance avec AlterEos permet de déduire**.

## Le mécanisme unique

Toute entreprise de 20 salariés et plus doit employer 6 % de travailleurs handicapés. À défaut,
elle paie. Mais 30 % du coût de main-d'œuvre facturé par une entreprise adaptée se **déduit**
de cette contribution, dans la limite de 50 % (ou 75 %) du montant brut. Autrement dit :
une part de la taxe peut être convertie en prestation utile. AlterEos est le prestataire.
Le simulateur rend ce basculement visible et chiffré.

## L'audience et sa scène réelle

DRH, RRH, responsable RSE, acheteur ou dirigeant d'une PME/ETI. Scène : bureau éclairé,
écran desktop, entre deux réunions ; ou mobile après avoir reçu la notification Urssaf de
l'effectif d'assujettissement au 15 mars. Il vient avec deux chiffres en tête (son effectif,
son nombre de RQTH) et une question : « combien je vais payer, et comment payer moins
en faisant mieux ». Il n'est pas expert du barème et se méfie des outils qui exigent son
email avant de répondre.

## Ce que la surface doit prouver

1. Le calcul est **juste** et traçable (barème officiel, sources citées, année de référence).
2. La déduction sous-traitance est **substantielle**, pas anecdotique.
3. AlterEos est un prestataire de production sérieux, pas un dispositif de défiscalisation.

## Mode

**Operate** (l'utilisateur accomplit une tâche : obtenir un chiffre fiable) avec une **clôture
Persuade** (l'écran de résultat doit faire agir). La lisibilité, les états et la conformité du
calcul priment sur l'expression ; la marque vit dans la précision des détails.

## Décisions produit actées

- Objectif prioritaire : **génération de leads** qualifiés.
- Précision : **complète, avec mode expert repliable** (ECAP, majoration 50 ans et +, dépenses
  déductibles, surcontribution). Le mode simple suffit à obtenir un résultat.
- **Le résultat n'est jamais bloqué** par un formulaire. Le CTA (rappel / rapport détaillé)
  arrive après le chiffre. Conformité RGPD : consentement explicite, finalité annoncée.
- Livraison : **plugin WordPress autonome + shortcode `[altereos_doeth]`**, assets vanilla,
  aucune dépendance externe, aucun appel réseau tiers.

## Contraintes non négociables

- **Accessibilité RGAA / WCAG 2.1 AA**. C'est une entreprise du handicap : un simulateur
  inaccessible serait un démenti de la marque. Navigation clavier complète, résultats annoncés
  aux lecteurs d'écran, contraste AA, aucune information portée par la seule couleur,
  respect de `prefers-reduced-motion`, cibles tactiles ≥ 44 px.
- **Honnêteté du chiffre** : c'est une estimation, jamais une déclaration. Le libellé le dit,
  et chaque ligne du calcul est dépliable pour montrer sa formule.
- Le moteur de calcul est **séparé de l'interface** et versionné par année de référence
  (barème 2025 et 2026), pour survivre aux évolutions réglementaires.

## Engagements de marque (hérités, à préserver)

- Vert AlterEos `#7DAC16`, bleu `#006089`, jaune `#FFC000`.
- Typographie de texte : Lato (incumbent du site).
- Ton : professionnel et chaleureux. Le handicap est présenté comme une performance
  d'entreprise, jamais comme de la charité. Pas de culpabilisation, pas de vocabulaire
  de « taxe punitive ».

## Hors périmètre

- Pas de télédéclaration : la DOETH se déclare en DSN, le simulateur ne s'y substitue pas.
- Pas de calcul de l'effectif moyen annuel d'assujettissement mois par mois (l'Urssaf le
  notifie) — champ de saisie, avec une aide expliquant où le trouver.
- Secteur public (FIPHFP) et accords agréés : signalés, non calculés.
