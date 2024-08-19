import * as lib from "../lib.js";
import CONSTANTS from "../constants.js";
import * as api from "../api.js";

export default {

	initializeMinions() {

		const minionAttacks = {};

		Hooks.on("dnd5e.preRollAttack", (item, rollConfig) => {

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = foundry.utils.getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			if (!api.isMinion(item.parent) || !isGroupAttack) return true;

			// If we've already prompted the user, and the attack hasn't gone through (and we didn't prompt for a save DC), then we continue the original attack
			if (minionAttacks[item.parent.uuid] && !minionAttacks[item.parent.uuid].attacked && !minionAttacks[item.parent.uuid].oldDC) {
				minionAttacks[item.parent.uuid].attacked = true;
				return true;
			}

			if (!minionAttacks[item.parent.uuid]) {
				Dialog.confirm({
					title: game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Title"),
					content: `
			<p>${game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Label")}</p>
			<p><input name="numberOfAttacks" type="number" value="1"></p>
		  `,
					yes: (html) => {
						return html.find('input[name="numberOfAttacks"]').val()
					},
					options: { height: "100%" }
				}).then(result => {
	
					const numberOfMinions = Math.max(1, Number(result) || 1);
	
					minionAttacks[item.parent.uuid] = {
						numberOfMinions,
						attacked: false
					};
	
					rollConfig.data.numberOfMinions = numberOfMinions;
					if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) {
						const containsNumberOfMinions = rollConfig.parts.includes(CONSTANTS.NUMBER_MINIONS_BONUS);
						rollConfig.parts = [];
						if (!containsNumberOfMinions) rollConfig.parts.push(numberOfMinions > 1 ? CONSTANTS.NUMBER_MINIONS_BONUS : '');
					}
	
					item.rollAttack(rollConfig);
	
				});
			} else {
				const numberOfMinions = minionAttacks[item.parent.uuid].numberOfMinions;
				rollConfig.data.numberOfMinions = numberOfMinions;
				if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) {
					const containsNumberOfMinions = rollConfig.parts.includes(CONSTANTS.NUMBER_MINIONS_BONUS);
					if (!containsNumberOfMinions) rollConfig.parts.push(numberOfMinions > 1 ? CONSTANTS.NUMBER_MINIONS_BONUS : '');
				}
				minionAttacks[item.parent.uuid].attacked = true;
				return true;
			}

			return false;

		});

		Hooks.on("dnd5e.preRollDamage", (item, rollConfig) => {

			if (item.system?.damage?.parts?.length < 1) return true;
			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;
			const isGroupAttack = foundry.utils.getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;
			if (!api.isMinion(item.parent) || !isGroupAttack) return true;

			if (minionAttacks?.[item.parent.uuid] && minionAttacks?.[item.parent.uuid].attacked) {

				rollConfig.data.numberOfMinions = Math.max(0, minionAttacks[item.parent.uuid].numberOfMinions - 1);
				rollConfig.parts = lib.patchItemDamageRollConfig(item);

				delete minionAttacks[item.parent.uuid];

				return true;

			} else if (!minionAttacks?.[item.parent.uuid]){

				Dialog.confirm({
					title: game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Title"),
					content: `
        <p>${game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Label")}</p>
        <p><input name="numberOfAttacks" type="number" value="1"></p>
      `,
					yes: (html) => {
						return html.find('input[name="numberOfAttacks"]').val()
					},
					options: { height: "100%" }
				}).then(result => {

					minionAttacks[item.parent.uuid] = {
						numberOfMinions: Math.max(1, Number(result) || 1),
						attacked: true
					};

					// Roll the damage with the existing config, which just includes the minion bonus
					item.rollDamage(rollConfig);

				});

				return false;

			}

		});

		Hooks.on("dnd5e.preUseItem", (item, config, options) => {
			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = foundry.utils.getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			const isScaleDC = foundry.utils.getProperty(item, CONSTANTS.FLAGS.DC_SCALING_ENABLED) ?? false;

			if (!api.isMinion(item.parent) || !isGroupAttack || !isScaleDC) return true;

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_DC_BONUS)) return true;

			if (!item.system.save || item.system.save?.ability == "" || !item.system.save?.dc) return true;

			if (minionAttacks?.[item.parent.uuid]?.oldDC) return true;
			Dialog.confirm({
				title: game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Title"),
				content: `
		<p>${game.i18n.localize("MINIONMANAGER.Dialogs.MinionAttack.Label")}</p>
		<p><input name="numberOfAttacks" type="number" value="1"></p>
		`,
				yes: (html) => {
					return html.find('input[name="numberOfAttacks"]').val()
				},
				options: { height: "100%" }
			}).then(result => {
				const numberOfMinions = Math.max(1, Number(result) || 1)
	
				minionAttacks[item.parent.uuid] = {
					numberOfMinions,
					attacked: false,
					oldDC: item.system.save?.dc
				};
	
				item.system.save.dc = item.system.save.dc + (numberOfMinions > 1 ? numberOfMinions : 0);
				item.use(config, options);
			});
			return false;
		});

		Hooks.on("dnd5e.useItem", async (item) => {
			let minionAttackData = minionAttacks?.[item.parent.uuid];
			if (minionAttackData?.oldDC) {
				item.system.save.dc = minionAttackData.oldDC;
			}
			if (!item.hasAttack) delete minionAttacks?.[item.parent.uuid];
			return true;
		});

		Hooks.on("dnd5e.rollDamage", async (item, damageRoll) => {

			const validAttack = lib.isValidOverkillItem(item);
			if (!validAttack) return true;

			const hitTargets = Array.from(game.user.targets)

			if (!hitTargets.length) return true;

			const hitTarget = hitTargets[0];

			if (!hitTarget?.actor || !api.isMinion(hitTarget?.actor) || api.isMinion(item.parent)) return true;

			let damageTotal = damageRoll.total;

			const minionHP = foundry.utils.getProperty(hitTarget.actor, "system.attributes.hp.value");

			if ((minionHP - damageTotal) > 0) return true;

			damageTotal -= minionHP;

			let maxAdditionalTargets = Math.ceil(damageTotal / minionHP);

			const label1Localization = "MINIONMANAGER.Dialogs.OverkillDamage." + (validAttack.isValidRangedAttack ? "RangedLabel1" : "MeleeLabel1");
			const label1 = game.i18n.format(label1Localization, {
				max_targets: maxAdditionalTargets + 1,
				total_targets: game.user.targets.size,
				name: hitTarget?.actor?.name ?? "unknown"
			});

			if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_MESSAGE)) {
				ChatMessage.create({
					content: `<h2>${game.i18n.localize("MINIONMANAGER.Dialogs.OverkillDamage.Title")}</h2><p>${label1}</p>`
				});
			}
		});

	}

}
