import * as api from "./api.js";
import CONSTANTS from "./constants.js";
import midiqol from "./plugins/midiqol.js";
import vanilla from "./plugins/vanilla.js";

export function initializeMinions() {

	if (CONSTANTS.MODULES.MIDI) {
		midiqol.initializeMinions();
	} else {
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

	Hooks.on("updateActor", (doc) => {
		const actorIsMinion = api.isMinion(doc);
		if (!doc.token || !actorIsMinion || getProperty(doc, "system.attributes.hp.value") > 0) return true;
		const groupNumber = getProperty(doc.token, CONSTANTS.FLAGS.GROUP_NUMBER);
		if (!groupNumber || !game.combats.viewed) return true;
		const existingCombatant = game.combats.viewed.combatants.find(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
		if (!existingCombatant) return true;
		const existingSubCombatants = foundry.utils.deepClone(getProperty(existingCombatant, CONSTANTS.FLAGS.COMBATANTS));
		if (!existingSubCombatants?.length) return true;
		const newToken = existingSubCombatants.map(uuid => fromUuidSync(uuid)).filter(foundToken => {
			return foundToken?.actor?.id && getProperty(foundToken?.actor, "system.attributes.hp.value") > 0;
		});
		if (!newToken.length) return true;
		existingCombatant.update({
			actorId: newToken[0].actor.id,
			tokenId: newToken[0].id
		});
	});

	/*Hooks.on("updateActor", (doc) => {
		if(!game.user.isGM || !game.combats.viewed) return;

		const actorIsMinion = api.isMinion(doc);
		if(!actorIsMinion) return;

		const groupNumber = getProperty(doc.token, CONSTANTS.FLAGS.GROUP_NUMBER);
		if (!groupNumber) return;

		const existingCombatant = game.combats.viewed.combatants.find(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
		if (!existingCombatant) return;

		const subCombatants = foundry.utils.deepClone(getProperty(existingCombatant, CONSTANTS.FLAGS.COMBATANTS) ?? [])
		if (!subCombatants.length) return;

		const documents = subCombatants.map((uuid) => fromUuidSync(uuid)).filter(Boolean);
		const everyMinionDefeated = documents.every(tokenDocument => tokenDocument.actor.system.attributes.hp.value === 0);
		if(!everyMinionDefeated) return;

		setTimeout(() => {
			canvas.scene.deleteEmbeddedDocuments("Token", documents.map(tokenDocument => tokenDocument.id));
		}, 500);

		Dialog.confirm({
			title: 'Group Defeated',
			content: `
        <p>Would you like to delete group number ${groupNumber}?</p>
      `,
			yes: () => {
				canvas.scene.deleteEmbeddedDocuments("Token", documents.map(tokenDocument => tokenDocument.id));
			},
			options: { height: "100%" }
		});
	});*/

}
