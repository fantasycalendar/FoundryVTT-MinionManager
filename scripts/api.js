import CONSTANTS from "./constants.js";
import { refreshInitiativeGroupGraphics } from "./initiative.js";
import * as lib from "./lib.js";
import { getSetting } from "./lib.js";

/**
 * Sets the group initiative of a set of tokens or actors.
 *
 * @param targets           The targets to set the group initiative for
 * @param groupNumber       The group initiative to set on the targets
 * @returns {boolean|Promise<Array<Document<any, Scene>>>}
 */
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

/**
 * Removes the group initiative of a set of tokens or actors.
 *
 * @param targets           The targets to remove the group initiative from
 * @returns {boolean|Promise<Array<Document<any, Scene>>>}
 */
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

/**
 * Helper function - turns a list of UUID strings/tokens/token documents into a list of the respective actors
 *
 * @param {Array<string|Token|TokenDocument|Actor>|string|Token|TokenDocument|Actor} targets
 * @returns {Array<Actor>}
 */
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

/**
 * Turns the given actors into minions by creating a minion feature document on the actor.
 *
 * @param {Array<string|Token|TokenDocument|Actor>|string|Token|TokenDocument|Actor} actors
 * @returns {Promise<void>}
 */
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

/**
 * Removes the minion feature from a set of actors, turning them back into normal actors.
 *
 * @param {Array<string|Token|TokenDocument|Actor>|string|Token|TokenDocument|Actor} actors
 * @returns {Promise<void>}
 */
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

/**
 * Helper function - returns true or false whether the given target is a minion or not
 *
 * @param target
 * @returns {boolean}
 */
export function isMinion(target) {
	target = target?.actor ?? target;
	const minionFeatureName = getSetting(CONSTANTS.SETTING_KEYS.MINION_FEATURE_NAME).toLowerCase();
	return target.items.some(item => item.name.toLowerCase() === minionFeatureName);
}

/**
 * Helper function - sets the given item to become a group attack type feature
 *
 * @param {Item} item
 * @param {boolean} isGroupAttack
 * @returns {Promise<Item>}
 */
export function setActorItemToGroupAttack(item, isGroupAttack = false) {
	return item.update({
		[CONSTANTS.FLAGS.MIDI_GROUP_ATTACK]: isGroupAttack
	})
}

/**
 * Helper function - returns whether the given item is a group attack type feature
 *
 * @param {Item} item
 * @returns {boolean}
 */
export function isItemGroupAttack(item) {
	return getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;
}

/**
 * Turns every feature or item on a given actor into group attack type features
 *
 * @param {Array<Actor>} actors
 * @returns {Promise<void>}
 */
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

/**
 * Reverts every feature or item on a given actor back into a normal item from being a group attack type feature
 *
 * @param {Array<Actor>} actors
 * @returns {Promise<void>}
 */
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
