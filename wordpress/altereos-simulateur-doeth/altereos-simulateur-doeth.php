<?php
/**
 * Plugin Name:       AlterEos — Simulateur DOETH
 * Description:       Simulateur de contribution OETH / DOETH avec estimation de la déduction liée à la sous-traitance au secteur adapté. Shortcode [altereos_doeth] ou bloc « Shortcode ».
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            AlterEos
 * License:           GPL-2.0-or-later
 * Text Domain:       altereos-doeth
 *
 * Le plugin n'appelle aucun service externe et ne dépose aucun cookie.
 * Les données saisies restent dans le navigateur du visiteur.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ALTEREOS_DOETH_VERSION', '1.0.0' );
define( 'ALTEREOS_DOETH_DIR', plugin_dir_path( __FILE__ ) );
define( 'ALTEREOS_DOETH_URL', plugin_dir_url( __FILE__ ) );

/**
 * Déclare les assets sans les charger : ils ne seront mis en file d'attente
 * que sur les pages qui contiennent réellement le shortcode.
 */
function altereos_doeth_register_assets() {
	$css = ALTEREOS_DOETH_DIR . 'assets/doeth-simulateur.css';
	$ver = file_exists( $css ) ? (string) filemtime( $css ) : ALTEREOS_DOETH_VERSION;

	wp_register_style(
		'altereos-doeth',
		ALTEREOS_DOETH_URL . 'assets/doeth-simulateur.css',
		array(),
		$ver
	);

	wp_register_script(
		'altereos-doeth-core',
		ALTEREOS_DOETH_URL . 'assets/doeth-core.js',
		array(),
		ALTEREOS_DOETH_VERSION,
		true
	);

	wp_register_script(
		'altereos-doeth',
		ALTEREOS_DOETH_URL . 'assets/doeth-simulateur.js',
		array( 'altereos-doeth-core' ),
		ALTEREOS_DOETH_VERSION,
		true
	);
}
add_action( 'init', 'altereos_doeth_register_assets' );

/**
 * Rend le simulateur.
 *
 * Attributs :
 *   annee      Année de référence présélectionnée (2025 ou 2026).
 *   contact    Sélecteur CSS du bloc de contact vers lequel renvoie l'appel
 *              à l'action. Défaut : #contact.
 *   message    Sélecteur CSS du champ de message à pré-remplir avec le
 *              résumé de la simulation. Laisser vide pour ne rien remplir.
 *   classe     Classes supplémentaires sur le conteneur.
 *
 * Exemple : [altereos_doeth annee="2026" contact="#formulaire-contact"
 *            message="#form-field-message"]
 */
function altereos_doeth_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'annee'   => '2026',
			'contact' => '#contact',
			'message' => '',
			'classe'  => '',
		),
		$atts,
		'altereos_doeth'
	);

	wp_enqueue_style( 'altereos-doeth' );
	wp_enqueue_script( 'altereos-doeth' );

	$attributs = array(
		'data-aeds'                => '',
		'class'                    => trim( 'aeds ' . $atts['classe'] ),
		'data-annee'               => preg_replace( '/\D/', '', $atts['annee'] ),
		'data-formulaire-contact'  => $atts['contact'],
		'data-champ-message'       => $atts['message'],
	);

	$rendu = '';
	foreach ( $attributs as $cle => $valeur ) {
		if ( '' === $valeur && 'data-aeds' !== $cle ) {
			continue;
		}
		$rendu .= ' ' . esc_attr( $cle ) . '="' . esc_attr( $valeur ) . '"';
	}

	$secours = sprintf(
		'<p><strong>%1$s</strong> %2$s</p>',
		esc_html__( 'Le simulateur nécessite JavaScript.', 'altereos-doeth' ),
		esc_html__(
			'Multipliez le nombre de bénéficiaires manquants (6 % de votre effectif, arrondi à l’unité inférieure, moins vos bénéficiaires employés) par 400, 500 ou 600 selon votre taille, puis par le SMIC horaire brut au 31 décembre de l’année déclarée. Contactez-nous pour une estimation détaillée.',
			'altereos-doeth'
		)
	);

	return '<div' . $rendu . '><noscript>' . $secours . '</noscript></div>';
}
add_shortcode( 'altereos_doeth', 'altereos_doeth_shortcode' );

/**
 * Charge les polices du thème si elles ne le sont pas déjà.
 * À supprimer si le thème AlterEos sert déjà Poppins et Lato : le simulateur
 * retombe alors proprement sur la pile système.
 */
function altereos_doeth_polices() {
	if ( ! apply_filters( 'altereos_doeth_charger_polices', false ) ) {
		return;
	}
	wp_enqueue_style(
		'altereos-doeth-polices',
		'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Poppins:wght@500;600;700&display=swap',
		array(),
		null
	);
}
add_action( 'wp_enqueue_scripts', 'altereos_doeth_polices' );
