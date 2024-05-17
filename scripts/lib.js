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


export function patchItemDamageRollConfig(item){
	return (item.system?.damage?.parts ?? []).map((part) => {
		const firstDamage = part[0].toString();
		const containsNumberOfMinions = firstDamage.includes(CONSTANTS.NUMBER_MINIONS_BONUS);
		const newFormula = containsNumberOfMinions ? firstDamage : `(${firstDamage} * ${CONSTANTS.NUMBER_MINIONS_BONUS})`;
		const damageType = part[1];

		return `${newFormula}${damageType ? `[${damageType}]` : ""}`
	})
}

export function hasActorItemNamed(target, itemName, lowerCase=false){
	target = target?.actor ?? target;
	return target && target.items.some(item => {
		return (lowerCase ? item.name.toLowerCase() : item.name) === (lowerCase ? itemName.toLowerCase() : itemName);
	});
}
