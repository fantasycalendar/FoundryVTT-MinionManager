import CONSTANTS from "./constants.js";
import { refreshInitiativeGroupGraphics } from "./initiative.js";
import * as api from "./api.js";
import { libWrapper } from "./libwrapper/shim.js";

export function initializeInterface() {

	let overrideDefeatedClick = false;

	Hooks.on("renderCombatTracker", async (app) => {
		app.element.find(".combatant").each(function () {
			const combatant = game.combats.viewed ? game.combats.viewed.combatants.get($(this).data("combatantId")) : null;
			if (!combatant) return;
			const minionGroup = foundry.utils.deepClone(getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER));
			if (!minionGroup) return;
			const tokenImageDiv = $("<div class='token-image'></div>");
			tokenImageDiv.append($(this).find(".token-image"));
			tokenImageDiv.append($(`<img class="minion-group" src="modules/${CONSTANTS.MODULE_NAME}/assets/${minionGroup}.svg"/>`))
			$(this).prepend(tokenImageDiv)
			const defeatedButton = $(this).find(`.combatant-control[data-control="toggleDefeated"]`);
			defeatedButton.on("click", (event) => {
				overrideDefeatedClick = true;
				event.preventDefault();
				event.stopPropagation();
				const isOn = !combatant.isDefeated;
				const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
				for (const uuid of foundry.utils.deepClone(getProperty(combatant, CONSTANTS.FLAGS.COMBATANTS)) ?? []) {
					const combatantToken = fromUuidSync(uuid);
					if (!combatantToken || combatantToken === combatant.token) continue;
					combatantToken.toggleActiveEffect(status, { overlay: true, active: isOn });
				}
				overrideDefeatedClick = false;
			});
		});
	});

	Hooks.on("renderTokenHUD", (app, element) => {
		app.element.find(`.control-icon[data-action="combat"]`).on('mousedown', function (evt) {
			if (evt.which !== 3 || !game.user.isGM) return;

			const clickedTokenDocument = app.object.document;

			const extra = $(`<div class="control-icon grouped-initiative"></div>`);

			for (let index = 0; index < 9; index++) {

				const newGroupNumber = Number(index) + 1;

				const groupAlreadyExists = game.combats.viewed ? game.combats.viewed.combatants.some(combatant => {
					return getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === newGroupNumber;
				}) : false;

				const colorBox = $(`<div class="minion-group ${groupAlreadyExists ? 'minion-group-used' : ''}" style='background-image: url(modules/${CONSTANTS.MODULE_NAME}/assets/${newGroupNumber}.svg);'></div>`);

				colorBox.on("click", async () => {

					const existingGroupNumber = getProperty(clickedTokenDocument, CONSTANTS.FLAGS.GROUP_NUMBER);
					const newTokens = canvas.tokens.controlled.map(t => t.document);
					const tokensKeptInOldGroup = canvas.scene.tokens.filter(oldToken => {
						const tokenGroupNumber = getProperty(oldToken, CONSTANTS.FLAGS.GROUP_NUMBER);
						return !newTokens.includes(oldToken) && existingGroupNumber && tokenGroupNumber && existingGroupNumber === tokenGroupNumber;
					});

					const existingCombatantGroup = game.combats.viewed ? game.combats.viewed.combatants.find(combatant => {
						return existingGroupNumber && getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === existingGroupNumber;
					}) : false;

					if (existingCombatantGroup && !tokensKeptInOldGroup.length) {
						await existingCombatantGroup.delete()
					} else if (existingCombatantGroup && tokensKeptInOldGroup.length) {
						await existingCombatantGroup.update({
							"actorId": tokensKeptInOldGroup[0].actor.id,
							"tokenId": tokensKeptInOldGroup[0].id,
							[CONSTANTS.FLAGS.COMBATANTS]: tokensKeptInOldGroup.map(t => t.uuid),
						});
					}

					if (newGroupNumber === existingGroupNumber) {

						await canvas.scene.updateEmbeddedDocuments("Token", newTokens.map(selectedToken => ({
							_id: selectedToken.id,
							[CONSTANTS.FLAGS.DELETE_GROUP_NUMBER]: null
						})));

					} else {

						await canvas.scene.updateEmbeddedDocuments("Token", newTokens.map(selectedToken => ({
							_id: selectedToken.id,
							[CONSTANTS.FLAGS.GROUP_NUMBER]: newGroupNumber
						})));

						if (!game.combats.viewed) {
							await Combat.create({ scene: canvas.scene.id });
						}

						const existingCombatantInNewGroup = game.combats.viewed.combatants.find(combatant => {
							return getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === newGroupNumber;
						})

						if (existingCombatantInNewGroup) {
							const existingUuids = foundry.utils.deepClone(getProperty(existingCombatantInNewGroup, CONSTANTS.FLAGS.COMBATANTS) ?? []);
							const newUuids = newTokens.map(selectedToken => {
								return `Scene.${selectedToken.parent.id}.Token.${selectedToken.id}`;
							});
							const combinedUuids = Array.from(new Set(existingUuids.concat(newUuids)));
							await existingCombatantInNewGroup.update({
								[CONSTANTS.FLAGS.COMBATANTS]: combinedUuids
							});
						} else {
							await game.combats.viewed.createEmbeddedDocuments("Combatant", [{
								tokenId: clickedTokenDocument.id,
								sceneId: clickedTokenDocument.parent.id,
								actorId: clickedTokenDocument.actor.id,
								[CONSTANTS.FLAGS.COMBATANTS]: newTokens.map(selectedToken => {
									return `Scene.${selectedToken.parent.id}.Token.${selectedToken.id}`
								})
							}]);
						}
					}

					ui.combat.render(true);
					canvas.tokens.controlled.map(refreshInitiativeGroupGraphics);

				});
				extra.append(colorBox);
			}

			element.find(".col.right").append(extra);
		})
	})

	libWrapper.register(CONSTANTS.MODULE_NAME, 'CombatTracker.prototype.getData', async function (wrapped, ...args) {
		const data = await wrapped(...args);
		for (const turn of data.turns) {
			const combatant = game.combats.viewed ? game.combats.viewed.combatants.get(turn.id) : false;
			if (!combatant) continue;
			const subCombatants = foundry.utils.deepClone(getProperty(combatant, CONSTANTS.FLAGS.COMBATANTS) ?? [])
			if (!subCombatants.length) continue;
			const documents = subCombatants.map((uuid) => fromUuidSync(uuid)).filter(Boolean);
			turn.defeated = documents.every(subTokenDocument => {
				return subTokenDocument.hasStatusEffect("dead");
			});
			const numberDefeated = documents.reduce((acc, subTokenDocument) => {
				return acc + !subTokenDocument.hasStatusEffect("dead");
			}, 0);
			turn.name = `${turn.name} (${numberDefeated}/${documents.length})`;
			if (!turn.defeated) {
				turn.css = turn.css.replace("defeated", "");
			}
		}
		return data;
	}, "WRAPPER");

	Hooks.on("preUpdateCombatant", (combatant, data) => {
		if (overrideDefeatedClick) return;
		const existingSubCombatants = foundry.utils.deepClone(getProperty(combatant, CONSTANTS.FLAGS.COMBATANTS));
		if (!existingSubCombatants?.length) return;
		if (data.defeated) return false;
	});

	Hooks.on("applyTokenStatusEffect", () => {
		ui.combat.render(true);
	});

	Hooks.on("getActorDirectoryEntryContext", (html, menuItems) => {
		menuItems.push({
			name: game.i18n.localize("MINIONMANAGER.ActorContextMenu.TurnIntoMinion"),
			icon: `<i class="fas fa-users"></i>`,
			callback: async (html) => {
				const actorId = html[0].dataset.documentId;
				const actor = game.actors.get(actorId);
				return api.turnIntoMinions(actor);
			},
			condition: (html) => {
				const actorId = html[0].dataset.documentId;
				const actor = game.actors.get(actorId);
				return game.user.isGM && !api.isMinion(actor);
			}
		}, {
			name: game.i18n.localize("MINIONMANAGER.ActorContextMenu.RevertFromMinion"),
			icon: `<i class="fas fa-users-slash"></i>`,
			callback: async (html) => {
				const actorId = html[0].dataset.documentId;
				const actor = game.actors.get(actorId);
				return api.revertMinions(actor);
			},
			condition: (html) => {
				const actorId = html[0].dataset.documentId;
				const actor = game.actors.get(actorId);
				return game.user.isGM && api.isMinion(actor);
			}
		});
	});

	Hooks.on("dnd5e.getItemContextOptions", (item, menuItems) => {
		const actor = item.parent;
		menuItems.push({
			name: game.i18n.localize("MINIONMANAGER.ItemContextMenu.TurnIntoMinionFeature"),
			icon: `<i class="fas fa-users"></i>`,
			callback: async () => {
				return api.setActorItemToGroupAttack(item, true);
			},
			condition: () => {
				return game.user.isGM && !api.isItemGroupAttack(item) && api.isMinion(actor);
			}
		}, {
			name: game.i18n.localize("MINIONMANAGER.ItemContextMenu.RevertFromMinionFeature"),
			icon: `<i class="fas fa-users-slash"></i>`,
			callback: async () => {
				return api.setActorItemToGroupAttack(item, false);
			},
			condition: () => {
				return game.user.isGM && api.isItemGroupAttack(item) && api.isMinion(actor);
			}
		});
	});

}
