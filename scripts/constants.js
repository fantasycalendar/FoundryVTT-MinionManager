const MODULE_NAME = "minionmanager";
const FLAG = `flags.${MODULE_NAME}`

const CONSTANTS = {
	MODULE_NAME,
	MINION_FEATURE: [{
		name: "Minion",
		type: "feat",
		img: "icons/magic/defensive/illusion-evasion-echo-purple.webp",
		system: {
			description: {
				value: ""
			}
		}
	}],
	ATTACK_TYPES: ["mwak", "rwak", "msak", "rsak"],
	NUMBER_MINIONS_BONUS: "@numberOfMinions",
	FLAGS: {
		COMBATANTS: `${FLAG}.combatants`,
		GROUP_NUMBER: `${FLAG}.groupNumber`,
		DELETE_GROUP_NUMBER: `${FLAG}.-=groupNumber`,
		MIDI_GROUP_ATTACK: "flags.midiProperties.grpact",
	},
	MODULES: {
		MIDI: false
	}
}

CONSTANTS["SETTING_KEYS"] = {
	DEBUG: "debug",
	ENABLE_OVERKILL_DAMAGE: "enableOverkillDamage",
	ENABLE_RANGED_OVERKILL: "enableRangedOverkill",
	ENABLE_SPELL_OVERKILL: "enableSpellOverkill",
	ENABLE_OVERKILL_MESSAGE: "enableOverkillMessage",
	ENABLE_GROUP_ATTACKS: "enableGroupAttacks",
	ENABLE_GROUP_ATTACK_BONUS: "enableGroupAttackBonus",
	ENABLE_MINION_SUPER_SAVE: "enableMinionSuperSave",
	MINION_FEATURE_NAME: "minionFeatureName",
	MINION_FEATURE_DESCRIPTION: "minionFeatureDescription",
}

CONSTANTS["SETTINGS"] = {
	[CONSTANTS.SETTING_KEYS.DEBUG]: {
		name: "MINIONMANAGER.Settings.Debug.Title",
		hint: "MINIONMANAGER.Settings.Debug.Hint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_DAMAGE]: {
		name: "MINIONMANAGER.Settings.EnableOverkillDamage.Title",
		hint: "MINIONMANAGER.Settings.EnableOverkillDamage.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_RANGED_OVERKILL]: {
		name: "MINIONMANAGER.Settings.EnableRangedOverkill.Title",
		hint: "MINIONMANAGER.Settings.EnableRangedOverkill.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_SPELL_OVERKILL]: {
		name: "MINIONMANAGER.Settings.EnableSpellOverkill.Title",
		hint: "MINIONMANAGER.Settings.EnableSpellOverkill.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_OVERKILL_MESSAGE]: {
		name: "MINIONMANAGER.Settings.EnableOverkillMessage.Title",
		hint: "MINIONMANAGER.Settings.EnableOverkillMessage.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS]: {
		name: "MINIONMANAGER.Settings.EnableGroupAttacks.Title",
		hint: "MINIONMANAGER.Settings.EnableGroupAttacks.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACK_BONUS]: {
		name: "MINIONMANAGER.Settings.EnableGroupAttackBonus.Title",
		hint: "MINIONMANAGER.Settings.EnableGroupAttackBonus.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.ENABLE_MINION_SUPER_SAVE]: {
		name: "MINIONMANAGER.Settings.EnableMinionSuperSave.Title",
		hint: "MINIONMANAGER.Settings.EnableMinionSuperSave.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	},

	[CONSTANTS.SETTING_KEYS.MINION_FEATURE_NAME]: {
		name: "MINIONMANAGER.Settings.MinionFeatureName.Title",
		hint: "MINIONMANAGER.Settings.MinionFeatureName.Hint",
		scope: "world",
		config: true,
		default: "Minion",
		required: true,
		type: String
	},

	[CONSTANTS.SETTING_KEYS.MINION_FEATURE_DESCRIPTION]: {
		name: "MINIONMANAGER.Settings.MinionFeatureDescription.Title",
		hint: "MINIONMANAGER.Settings.MinionFeatureDescription.Hint",
		scope: "world",
		config: true,
		default: "If the minion takes damage from an attack or as the result of a failed saving throw, their hit points are reduced to 0. If the minion takes damage from another effect, they die if the damage equals or exceeds their hit point maximum, otherwise they take no damage.",
		required: true,
		type: String
	},
}


export default CONSTANTS;
