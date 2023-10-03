import CONSTANTS from "./constants.js";
import { refreshInitiativeGroupGraphics } from "./initiative.js";
import * as lib from "./lib.js";
import { getSetting } from "./lib.js";

export function setGroupInitiative(targets, groupNumber = 1) {
	if (!Array.isArray(targets)) targets = [targets]
	targets = targets.map(target => target?.document ?? target);
	if (!targets.some(target => target instanceof TokenDocument)) {
		lib.error(`Minion Manager | setGroupInitiative | Targets you provided were not tokens`);
		return false;
	}
	if (groupNumber < 1 || groupNumber > 9) {
		lib.error(`Minion Manager | setGroupInitiative | Group number must be between 1 and 9`);
		return false;
	}
	const updates = targets.map(target => ({
		_id: target.id,
		[CONSTANTS.FLAGS.GROUP_NUMBER]: groupNumber
	}));

	const promise = canvas.scene.updateEmbeddedDocuments("Token", updates);

	promise.then(() => {
		ui.combat.render(true);
		targets.forEach(refreshInitiativeGroupGraphics);
	});

	return promise;
}

export function removeGroupInitiative(targets) {
	if (!Array.isArray(targets)) targets = [targets]
	targets = targets.map(target => target?.document ?? target);
	if (!targets.some(target => target instanceof TokenDocument)) {
		lib.error(`Minion Manager | removeGroupInitiative | Targets you provided were not tokens`);
		return false;
	}
	const updates = targets.map(target => ({
		_id: target.id,
		[CONSTANTS.FLAGS.DELETE_GROUP_NUMBER]: null
	}));

	const promise = canvas.scene.updateEmbeddedDocuments("Token", updates);

	promise.then(() => {
		ui.combat.render(true);
		targets.forEach(refreshInitiativeGroupGraphics);
	});

	return promise;
}

export function getActors(targets) {
	if (!Array.isArray(targets)) targets = [targets]
	return targets.map(potentialToken => {
		let actor = potentialToken?.actor ?? potentialToken;
		if (typeof potentialToken === "string") {
			actor = fromUuidSync(potentialToken) ?? game.actors.get(potentialToken) ?? game.actors.getName(potentialToken);
		}
		return actor;
	}).filter(actor => actor instanceof Actor);
}

export async function turnIntoMinions(actors) {
	actors = getActors(actors);
	const minionFeatureName = getSetting(CONSTANTS.SETTING_KEYS.MINION_FEATURE_NAME);
	const minionFeatureTemplate = foundry.utils.mergeObject(
		foundry.utils.deepClone(CONSTANTS.MINION_FEATURE),
		{
			name: minionFeatureName,
			system: {
				description: {
					value: `<p>${getSetting(CONSTANTS.SETTING_KEYS.MINION_FEATURE_DESCRIPTION)}</p>`
				}
			}
		}
	)
	for (const actor of actors) {
		const minionFeature = actor.items.find(item => item.name.toLowerCase() === minionFeatureName.toLowerCase());
		if (!minionFeature) {
			await actor.createEmbeddedDocuments("Item", minionFeatureTemplate)
		}
	}
	if (actors.length) lib.log(`Turned ${actors.length} actors into minions.`);
}

export async function revertMinions(actors) {
	actors = getActors(actors);
	const minionFeatureName = getSetting(CONSTANTS.SETTING_KEYS.MINION_FEATURE_NAME).toLowerCase();
	for (const actor of actors) {
		const minionFeature = actor.items.find(item => item.name.toLowerCase() === minionFeatureName);
		if (minionFeature) {
			await minionFeature.delete();
		}
	}
	if (actors.length) lib.log(`Reverted ${actors.length} actors from being minions.`);
}

export function isMinion(target) {
	target = target?.actor ?? target;
	const minionFeatureName = getSetting(CONSTANTS.SETTING_KEYS.MINION_FEATURE_NAME).toLowerCase();
	return target.items.some(item => item.name.toLowerCase() === minionFeatureName);
}

export function setActorItemToGroupAttack(item, bool = false) {
	return item.update({
		[CONSTANTS.FLAGS.MIDI_GROUP_ATTACK]: bool
	})
}

export function isItemGroupAttack(item) {
	return getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;
}

export async function turnActorAttacksIntoGroupActions(actors) {
	actors = getActors(actors);
	for (const actor of actors) {
		await actor.updateEmbeddedDocuments("Item", actor.items.filter(item => CONSTANTS.ATTACK_TYPES.includes(item.system.actionType)).map(item => {
			return {
				_id: item.id,
				[CONSTANTS.FLAGS.MIDI_GROUP_ATTACK]: true
			}
		}));
	}
	if (actors.length) lib.log(`Turned ${actors.length} actors' attacks into group actions.`);
}

export async function revertActorAttacksFromGroupActions(actors) {
	actors = getActors(actors);
	for (const actor of actors) {
		await actor.updateEmbeddedDocuments("Item", actor.items.filter(item => CONSTANTS.ATTACK_TYPES.includes(item.system.actionType)).map(item => {
			return {
				_id: item.id,
				[CONSTANTS.FLAGS.MIDI_GROUP_ATTACK]: false
			}
		}));
	}
	if (actors.length) lib.log(`Reverted ${actors.length} actors' attacks from group actions.`);
}
