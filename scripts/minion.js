import * as api from "./api.js";
import * as lib from "./lib.js";
import CONSTANTS from "./constants.js";

export function initializeMinions() {

	const workflows = {}

	Hooks.on("midi-qol.preAttackRoll", async (workflow) => {

		if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

		const isGroupAttack = getProperty(workflow.item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

		if (!api.isMinion(workflow.actor) || !isGroupAttack) return true;

		const result = await Dialog.confirm({
			title: game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Title"),
			content: `
        <p>${game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Label")}</p>
        <p><input name="numberOfAttacks" type="number" value="1"></p>
      `,
			yes: (html) => {
				return html.find('input[name="numberOfAttacks"]').val()
			},
			options: { height: "100%" }
		})

		const numMinionsAttacked = Number(result) || 1;
		workflows[workflow.id] = numMinionsAttacked;

		if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) return true;

		const attackHookId = Hooks.on("dnd5e.preRollAttack", (rolledItem, rollConfig) => {
			if (rolledItem !== workflow.item) return true;
			rollConfig.fastForward = true;
			rollConfig.parts.push(numMinionsAttacked);
			Hooks.off("dnd5e.preRollAttack", attackHookId);
			return true;
		});
		return true;

	});

	Hooks.on("midi-qol.preDamageRoll", async (workflow) => {

		if (!workflows?.[workflow.id]) return true;
		if (workflow.item.system?.damage?.parts?.length < 1) return true;

		const numMinionsAttacked = workflows[workflow.id];
		delete workflows[workflow.id];
		const firstDamage = workflow.item.system.damage.parts[0][0];
		const newFormula = isNaN(Number(firstDamage))
			? firstDamage + " * " + numMinionsAttacked
			: Number(firstDamage) * numMinionsAttacked;

		const damageType = workflow.item.system.damage.parts[0][1];

		const damageHookId = Hooks.on("dnd5e.preRollDamage", (rolledItem, rollConfig) => {
			if (rolledItem !== workflow.item) return true;
			rollConfig.fastForward = true;
			rollConfig.parts[0] = [`${newFormula}${damageType ? `[${damageType}]` : ""}`];
			Hooks.off("dnd5e.preRollDamage", damageHookId);
			return true;
		});

		return true;
	});

	Hooks.on("midi-qol.postCheckSaves", async (workflow) => {
		if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_MINION_SUPER_SAVE)) return;
		for (const savedToken of workflow.saves) {
			if (!api.isMinion(savedToken)) continue;
			workflow.superSavers.add(savedToken);
		}
	});

	Hooks.on("midi-qol.preDamageRollComplete", async (workflow) => {

		if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_DAMAGE)) return true;

		// Overkill management
		const actionType = workflow.item.system?.actionType;

		if (!actionType || !(actionType === "mwak" || actionType === "msak")) return true;
		if (!workflow.hitTargets.size) return true;

		const hitTarget = Array.from(workflow.hitTargets)[0]

		if (!api.isMinion(hitTarget.actor)) return true;

		let damageTotal = workflow.damageTotal;

		const minionHP = getProperty(hitTarget.actor, "system.attributes.hp.value");

		if ((minionHP - damageTotal) > 0) return true;

		damageTotal -= minionHP;

		const closestTokens = new Set(canvas.tokens.placeables
			.filter(_token => hitTarget.actor.name === _token.actor.name && canvas.grid.measureDistance(workflow.token, _token) <= workflow.item.system.range.value + 2.5)
			.sort((a, b) => canvas.grid.measureDistance(workflow.token, b) - canvas.grid.measureDistance(workflow.token, a)));

		closestTokens.delete(game.user.targets.first())

		let maxAdditionalTargets = Math.ceil(damageTotal / minionHP);
		Array.from(closestTokens)
			.slice(0, maxAdditionalTargets)
			.forEach(_token => _token.setTarget(true, { releaseOthers: false }));

		await Dialog.confirm({
			"title": game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Title"),
			"content": `
	    <p style='text-align:center;'>${game.i18n.format("MINIONMANAGER.Dialogs.OverkillDamage.Label1", {
				targets: maxAdditionalTargets + 1,
				name: hitTarget.actor.name
			})}</p>
	    <p style='text-align:center;'>${game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Label2")}</p>
	  `,
			"rejectClose": false,
			options: { top: 150 }
		});

		const userTargets = new Set([...game.user.targets]
			.filter(_token => _token.name === hitTarget.name)
		);

		userTargets.delete(hitTarget);

		[...userTargets].slice(0, maxAdditionalTargets).forEach(target => workflow.hitTargets.add(target));

		return true;

	});

	Hooks.on("preUpdateToken", (doc, change) => {
		const actorIsMinion = api.isMinion(doc.actor);
		if (!actorIsMinion || !hasProperty(change, "system.attributes.hp.value")) return true;
		if (getProperty(change, "system.attributes.hp.value") < getProperty(doc.actor, "system.attributes.hp.value")) {
			change["system.attributes.hp.value"] = 0;
		}
		return true;
	});

}
