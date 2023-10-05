import * as lib from "../lib.js";
import CONSTANTS from "../constants.js";
import * as api from "../api.js";

export default {

	initializeMinions() {

		const minionAttacks = {};

		Hooks.on("dnd5e.preRollAttack", (item, rollConfig) => {

			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;

			const isGroupAttack = getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;

			if (!api.isMinion(item.parent) || !isGroupAttack) return true;

			// If we've already prompted the user, and the attack hasn't gone through, then we continue the original attack
			if (minionAttacks[item.parent.uuid] && !minionAttacks[item.parent.uuid].attacked) {
				rollConfig.parts = minionAttacks[item.parent.uuid].rollConfig.parts;
				minionAttacks[item.parent.uuid].attacked = true;
				return true;
			}

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

				const numMinionsAttacked = Number(result) || 1;

				if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) {
					rollConfig.parts.push(numMinionsAttacked);
				}

				minionAttacks[item.parent.uuid] = { numMinionsAttacked, rollConfig, attacked: false };

				// Roll the attack with the existing config, which just includes the minion bonus
				item.rollAttack(rollConfig);

			});

			return false;

		});

		const minionOnlyDamages = {};

		Hooks.on("dnd5e.preRollDamage", (item, rollConfig) => {

			if (item.system?.damage?.parts?.length < 1) return true;
			if (!lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS)) return true;
			const isGroupAttack = getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;
			if (!api.isMinion(item.parent) || !isGroupAttack) return true;

			if (minionAttacks?.[item.parent.uuid]) {

				const numMinionsAttacked = minionAttacks[item.parent.uuid].numMinionsAttacked;
				delete minionAttacks[item.parent.uuid];
				const firstDamage = item.system.damage.parts[0][0];
				const newFormula = isNaN(Number(firstDamage))
					? firstDamage + " * " + numMinionsAttacked
					: Number(firstDamage) * numMinionsAttacked;

				const damageType = item.system.damage.parts[0][1];

				rollConfig.parts[0] = [`${newFormula}${damageType ? `[${damageType}]` : ""}`];

				return true;

			} else {

				// If we've already prompted the user, and the attack hasn't gone through, then we continue the original attack
				if (minionOnlyDamages[item.parent.uuid] && !minionOnlyDamages[item.parent.uuid].attacked) {
					const firstDamage = item.system.damage.parts[0][0];
					const newFormula = isNaN(Number(firstDamage))
						? firstDamage + " * " + minionOnlyDamages[item.parent.uuid].numMinionsAttacked
						: Number(firstDamage) * minionOnlyDamages[item.parent.uuid].numMinionsAttacked;

					delete minionOnlyDamages[item.parent.uuid];

					const damageType = item.system.damage.parts[0][1];

					if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS)) {
						rollConfig.parts[0] = [`${newFormula}${damageType ? `[${damageType}]` : ""}`];
					}

					return true;
				}

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

					const numMinionsAttacked = Number(result) || 1;

					minionOnlyDamages[item.parent.uuid] = { numMinionsAttacked, rollConfig, attacked: false };

					// Roll the damage with the existing config, which just includes the minion bonus
					item.rollDamage(rollConfig);

				});

				return false;

			}

		});

	}

}
