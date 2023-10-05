import * as api from "./api.js";
import CONSTANTS from "./constants.js";
import midiqol from "./plugins/midiqol.js";
import vanilla from "./plugins/vanilla.js";

export function initializeMinions() {

	if(CONSTANTS.MODULES.MIDI){
		midiqol.initializeMinions();
	}else{
		vanilla.initializeMinions();
	}

	Hooks.on("preUpdateActor", (doc, change) => {
		const actorIsMinion = api.isMinion(doc);
		if (!actorIsMinion || !hasProperty(change, "system.attributes.hp.value")) return true;
		if (getProperty(change, "system.attributes.hp.value") < getProperty(doc, "system.attributes.hp.value")) {
			change["system.attributes.hp.value"] = 0;
		}
		return true;
	});

}
