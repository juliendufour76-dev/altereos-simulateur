# DESIGN.md — Simulateur DOETH AlterEos

Système visuel tel que construit, hérité de la maquette « Calculateur OETH » de la
refonte. Ce document décrit le rendu réel, pas une intention.

## Le parti pris

La contribution OETH n'est pas un montant à afficher, c'est une **masse à répartir**.
L'écran de résultat refuse le compteur unique : il montre la contribution brute
scindée en trois parts — ce qui reste dû, ce qui est encore transformable en
prestation, ce qui est déjà déduit. Le curseur fait bouger cette répartition sous les
yeux de l'utilisateur. C'est le mécanisme d'AlterEos, rendu littéral.

## Couleur

Stratégie **retenue** : neutres clairs, une seule couleur d'action, une seule couleur
de valeur. La bande pâle et les cartes blanches viennent de la maquette.

| Jeton | Valeur | Emploi |
|---|---|---|
| `--ae-orange` | `#ef7c00` | **Action, et rien d'autre.** Boutons principaux, contour de focus, flèche des volets. |
| `--ae-orange-clair` | `#f5a623` | Départ du dégradé des boutons. |
| `--ae-orange-fonce` | `#b85c00` | Orange sur fond clair pour le texte (4,6:1). |
| `--ae-vert` | `#7dac16` | Valeur transformée : part déduite, part mobilisable, coche active. |
| `--ae-vert-fonce` | `#4e6d0c` | Vert lisible en texte (5,4:1). |
| `--ae-vert-voile` | `#f1f7e3` | Fond du curseur et du bloc « levier ». |
| `--ae-ardoise` | `#7e96a3` | Part restant due. Neutre volontairement : ni rouge, ni alarme. |
| `--ae-bande` | `#f1f5f8` | Fond de section. |
| `--ae-encre` | `#1f2a30` | Texte courant, ligne de total du tableau. |
| `--ae-gris` | `#5b6b75` | Texte secondaire (5,0:1 minimum partout). |

**Règle de discipline** : l'orange ne décrit jamais une donnée, le vert ne déclenche
jamais une action. Le montant à payer n'est pas rouge — la marque ne culpabilise pas.

## Typographie

Piles héritées du site, aucune police supplémentaire chargée.

- Titres : `Poppins`, 500–700, `letter-spacing: -0.02em`, `line-height: 1.15`.
- Texte : `Lato`, 400–900, `line-height: 1.6`.
- Chiffres : `font-variant-numeric: tabular-nums` partout où un montant peut changer,
  pour que rien ne tressaute pendant l'animation.
- Montant principal : `clamp(2.5rem, 1.6rem + 3.4vw, 3.75rem)`, `-0.04em`.
- Mesure de lecture bornée à 60–68 caractères sur les blocs de texte.

## Matière et profondeur

- Rayons : `20px` pour les grands blocs, `14px` pour les cartes de formulaire,
  `10px` pour les champs, `999px` pour les boutons et les pastilles.
- Ombres à décalage et flou doux : `0 2px 8px rgba(31,42,48,.05), 0 28px 60px -32px
  rgba(31,42,48,.35)`. Jamais de halo sans décalage.
- Les cartes de formulaire n'ont pas de bordure : c'est l'ombre qui les détache.
- Aucun dégradé de texte, aucun glassmorphisme, aucune bordure latérale colorée.

## Rythme

Échelle unique `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4.5 rem`, exposée en jetons
`--ae-r1` à `--ae-r8`. Plus d'espace au-dessus d'un titre qu'en dessous.

La remise à zéro passe par `:where()` : elle n'apporte aucune spécificité et ne peut
donc pas écraser les marges des composants. C'est une contrainte structurante du
fichier — toute règle de reset ajoutée doit suivre la même forme.

## Composition

- Deux colonnes à partir de `64rem` : saisie à gauche, résultat collant à droite.
  En dessous, une seule colonne et une barre de rappel fixe en bas d'écran qui
  n'apparaît que lorsque le panneau sort du champ de vision.
- Le formulaire est découpé en trois cartes — effectif, bénéficiaires, achats — plus
  un volet repliable pour les situations particulières. Le mode simple suffit à
  obtenir un résultat : rien d'obligatoire n'est caché dans le volet.
- Le détail du calcul est un tableau pleine largeur sous l'atelier, chaque ligne
  portant sa formule en sous-texte. Il est imprimable tel quel.

## Mouvement

Un seul moment chorégraphié : **la scission de la masse**. Les trois parts de la barre
transitionnent en largeur sur `560ms cubic-bezier(.22,.85,.2,1)` et le montant
principal est interpolé sur `460ms` en ease-out cubique. Tout le reste se contente de
`200ms` sur la couleur et la bordure.

La barre porte `contain: layout paint` : les parts se poussent l'une l'autre, ce qu'un
`scaleX` déformerait (les hachures s'étireraient), donc le recalcul est confiné.

`prefers-reduced-motion` coupe l'interpolation du montant et toutes les transitions.

## Accessibilité — contraintes de conception

Non négociable : le produit est vendu par une entreprise adaptée.

- Trois parts distinguées par **motif** (plein, hachuré) autant que par couleur, et
  chiffrées en toutes lettres dans la légende.
- `role="img"` + `aria-label` chiffré sur la barre ; `role="status"` concis pour le
  résultat, jamais bavard.
- Contrastes mesurés : minimum relevé 5,0:1 sur le texte secondaire.
- Cibles ≥ 43 px sur tous les contrôles pointés.
- Contour de focus orange 3px, décalé de 2px, jamais supprimé.
- `forced-colors: active` redessine les parts en `Highlight` / `GrayText` / tiret.

## Ce que ce système refuse

- Bloquer le résultat derrière un e-mail.
- Le rouge, l'alarme, le vocabulaire de la sanction.
- Une grille de cartes « icône + titre + texte » comme structure de page.
- Un surtitre au-dessus d'un titre.
- Une modale pour une tâche qui n'a besoin ni d'interruption ni de focus protégé.
