import * as lib from "../lib.js";
import CONSTANTS from "../constants.js";
import * as api from "../api.js";
import { patchRollConfig } from "../lib.js";

export default {

	initializeMinions() {

		const minionAttacks = {}

		Hooks.on("midi-qol.preAttackRoll", async (workflow) => {

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = foundry.utils.getProperty(workflow.item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			if (!workflow?.actor || !api.isMinion(workflow?.actor) || !isGroupAttack) return true;

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

			const numberOfMinions = Math.max(1, Number(result) || 1)
			minionAttacks[workflow.id] = numberOfMinions;

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) return true;

			const attackHookId = Hooks.on("dnd5e.preRollAttack", (rolledItem, rollConfig) => {
				if (rolledItem !== workflow.item) return true;
				rollConfig.data.numberOfMinions = numberOfMinions;
				const containsNumberOfMinions = rollConfig.parts.some(part => part[0].includes(CONSTANTS.NUMBER_MINIONS_BONUS))
				if(!containsNumberOfMinions) rollConfig.parts.push(numberOfMinions > 1 ? CONSTANTS.NUMBER_MINIONS_BONUS : '');
				Hooks.off("dnd5e.preRollAttack", attackHookId);
				return true;
			});
			return true;

		});

		Hooks.on("midi-qol.preDamageRoll", async (workflow) => {

			if (workflow.item.system?.damage?.parts?.length < 1) return true;

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = foundry.utils.getProperty(workflow.item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			if (!api.isMinion(workflow.actor) || !isGroupAttack) return true;

			if (!minionAttacks?.[workflow.id]) {

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

				minionAttacks[workflow.id] = Math.max(1, Number(result) || 1);

			}

			const numberOfMinions = minionAttacks[workflow.id];

			const damageHookId = Hooks.on("dnd5e.preRollDamage", (rolledItem, data) => {
				const rollConfig = data?.rollConfig ?? data;
				if (rolledItem !== workflow.item) return true;
				rollConfig.data.numberOfMinions = Math.max(0, numberOfMinions - 1);
				lib.patchRollConfig(rollConfig);
				Hooks.off("dnd5e.preRollDamage", damageHookId);
				return true;
			});

			if (!workflow.hasSave) delete minionAttacks[workflow.id];

			return true;

		});

		Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = getProperty(workflow.item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			const isScaleDC = getProperty(workflow.item, CONSTANTS.FLAGS.DC_SCALING_ENABLED) ?? false;

			if (!workflow.actor || !api.isMinion(workflow?.actor) || !isGroupAttack || !isScaleDC) return true;

			if (!minionAttacks?.[workflow.id]) {
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
	
				minionAttacks[workflow.id] = Math.max(1, Number(result) || 1);;
			}

			const numberOfMinions = minionAttacks[workflow.id];

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_DC_BONUS)) return true;
			
			workflow.item = workflow.item.clone({"system.save": {"dc": workflow.item.system.save.dc + (numberOfMinions > 1 ? numberOfMinions : 0), "scaling": "flat"}}, {"keepId": true});
			workflow.item.prepareData();
			workflow.item.prepareFinalAttributes();
			delete minionAttacks[workflow.id];
		});

		Hooks.on("midi-qol.postCheckSaves", async (workflow) => {
			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_MINION_SUPER_SAVE)) return;
			for (const savedToken of workflow.saves) {
				if (!api.isMinion(savedToken)) continue;
				workflow.superSavers.add(savedToken);
			}
		});

		Hooks.on("midi-qol.preDamageRollComplete", async (workflow) => {

			const validAttack = lib.isValidOverkillItem(workflow.item);
			if (!validAttack) return true;
			if (!workflow.hitTargets.size) return true;

			const hitTarget = Array.from(workflow.hitTargets)[0]

			if (!hitTarget?.actor || !api.isMinion(hitTarget?.actor)) return true;

			let damageTotal = workflow.damageTotal;

			const minionHP = foundry.utils.getProperty(hitTarget?.actor, "system.attributes.hp.value");

			if ((minionHP - damageTotal) > 0) return true;

			damageTotal -= minionHP;

			const closestTokens = new Set(canvas.tokens.placeables
				.filter(_token => {
					const withinRange = canvas.grid.measureDistance(workflow.token, _token) <= workflow.item.system.range.value + 2.5;
					return hitTarget?.actor && _token?.actor && hitTarget.document?.baseActor?.name === _token?.document?.baseActor?.name && withinRange;
				})
				.sort((a, b) => canvas.grid.measureDistance(workflow.token, a) - canvas.grid.measureDistance(workflow.token, b)));

			closestTokens.delete(game.user.targets.first());

			let maxAdditionalTargets = Math.ceil(damageTotal / minionHP);
			Array.from(closestTokens)
				.slice(0, maxAdditionalTargets)
				.forEach(_token => _token.setTarget(true, { releaseOthers: false }));

			const label1Localization = "MINIONMANAGER.Dialogs.OverkillDamage." + (validAttack.isValidRangedAttack ? "RangedLabel1" : "MeleeLabel1");
			const label1 = game.i18n.format(label1Localization, {
				max_targets: maxAdditionalTargets + 1,
				total_targets: game.user.targets.size,
				name: hitTarget.actor.name
			});

			let label2 = game.i18n.format("MINIONMANAGER.Dialogs.OverkillDamage.Label2", {
				max_targets: maxAdditionalTargets + 1,
				total_targets: game.user.targets.size
			});

			let targetingHookId = false;
			await Dialog.prompt({
				"title": game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Title"),
				"content": `
	    <p style='text-align:center;'>${label1}</p>
	    <p style='text-align:center;' class="minion-manager-targets">${label2}</p>
	    <p style='text-align:center;'>${game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Label3")}</p>
	  `,
				"rejectClose": false,
				render: (html) => {
					targetingHookId = Hooks.on("targetToken", () => {
						html.find(".minion-manager-targets").text(game.i18n.format("MINIONMANAGER.Dialogs.OverkillDamage.Label2", {
							max_targets: maxAdditionalTargets + 1,
							total_targets: game.user.targets.size
						}))
					})
				},
				options: { top: 150 }
			});

			const userTargets = new Set([...game.user.targets]
				.filter(_token => _token.document.baseActor.name === hitTarget.document.baseActor.name)
			);

			userTargets.delete(hitTarget);

			await MidiQOL.applyTokenDamage(
				workflow.damageDetail,
				workflow.damageTotal,
				new Set([...userTargets].slice(0, maxAdditionalTargets)),
				workflow.item
			);

			if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_MESSAGE)) {
				ChatMessage.create({
					content: `<h2>${game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Title")}</h2><p>${label1}</p>`
				});
			}

			return true;

		});

	}

}
