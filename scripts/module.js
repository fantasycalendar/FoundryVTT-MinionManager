import CONSTANTS from "./constants.js";
import { initializeMinions } from "./minion.js";
import { initializeInterface } from "./interface.js";
import { initializeInitiative } from "./initiative.js";
import * as API from "./api.js";

let midiActive = false;

Hooks.on("init", () => {
	midiActive = game.modules.get("midi-qol")?.active;
	if (!midiActive) return;
	initializeSettings();
	initializeMinions();
	initializeInterface();
	initializeInitiative();
});

Hooks.once("ready", () => {
	if (!midiActive) {
		ui.notifications.error(game.i18n.localize("MINIONMANAGER.Errors.MidiActive"))
		return
	}
	if (midiActive) {
		const flagName = CONSTANTS.FLAGS.MIDI_GROUP_ATTACK.split(".").pop();
		CONFIG.DND5E.midiProperties[flagName] = "Group Action";
	}

	game.modules.get(CONSTANTS.MODULE_NAME).api = API;
});

function initializeSettings() {
	for (const [key, setting] of Object.entries(CONSTANTS.SETTINGS)) {
		game.settings.register(CONSTANTS.MODULE_NAME, key, setting);
	}
}
