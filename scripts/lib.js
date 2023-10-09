import CONSTANTS from "./constants.js";

export function error(msg, args = {}) {
	ui.notifications.error(`Minion Manager | ${game.i18n.format(msg, args)}`)
}

export function warning(msg, args = {}) {
	ui.notifications.warn(`Minion Manager | ${game.i18n.format(msg, args)}`)
}

export function info(msg, args = {}) {
	ui.notifications.info(`Minion Manager | ${game.i18n.format(msg, args)}`)
}

export function log(msg, args = {}) {
	if (!getSetting(CONSTANTS.SETTING_KEYS.DEBUG)) return;
	console.log(`Minion Manager | ${game.i18n.format(msg, args)}`)
}

export function getSetting(key) {
	return game.settings.get(CONSTANTS.MODULE_NAME, key);
}

export function isValidOverkillItem(item) {

	if (!getSetting(CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_DAMAGE)) return false;

	const actionType = item.system?.actionType;

	const spellsAllowed = getSetting(CONSTANTS.SETTING_KEYS.ENABLE_SPELL_OVERKILL)
	const isValidMeleeAttack = actionType === "mwak" || (spellsAllowed && actionType === "msak");
	const isValidRangedAttack = actionType === "rwak" || (spellsAllowed && actionType === "rsak");

	if (!actionType || !(isValidMeleeAttack || isValidRangedAttack)) return false;
	if (!getSetting(CONSTANTS.SETTING_KEYS.ENABLE_RANGED_OVERKILL) && isValidRangedAttack) return false;

	return { isValidMeleeAttack, isValidRangedAttack };

}

export function getActiveGM() {
	return game.users
		.filter(u => u.active && u.isGM)
		.sort((a, b) => a.isGM && !b.isGM ? -1 : 1)?.[0];
}
