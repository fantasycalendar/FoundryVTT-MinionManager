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
