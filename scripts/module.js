import CONSTANTS from "./constants.js";
import { initializeMinions } from "./minion.js";
import { initializeInterface } from "./interface.js";
import { initializeInitiative } from "./initiative.js";
import * as API from "./api.js";

Hooks.on("init", () => {
	CONSTANTS.MODULES.MIDI = game.modules.get("midi-qol")?.active;
	initializeSettings();
	initializeMinions();
	initializeInterface();
	initializeInitiative();
});

Hooks.once("ready", () => {
	if (CONSTANTS.MODULES.MIDI) {
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
