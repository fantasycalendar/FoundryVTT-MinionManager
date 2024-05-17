import CONSTANTS from "./constants.js";

export function refreshInitiativeGroupGraphics(t) {

	const tokenDocument = t?.document ?? t;
	const tokenObject = t?.object ?? t;

	const minionTurn = foundry.utils.deepClone(getProperty(tokenDocument, CONSTANTS.FLAGS.GROUP_NUMBER));
	const existingSprite = tokenObject.children.find(graphic => graphic.minionGroupCircle);

	if (existingSprite && !minionTurn) {
		existingSprite.destroy();
		existingSprite._background.destroy();
	} else if (minionTurn) {

		if (existingSprite && existingSprite.turn === minionTurn) return;

		if (existingSprite) {
			existingSprite.turn = minionTurn;
		}

		const diameter = 24 * (canvas.grid.size / 100) * tokenDocument.width;
		const x = (tokenDocument.width * canvas.grid.size) - diameter - 4;
		const y = (tokenDocument.height * canvas.grid.size) - diameter - 4;

		PIXI.Texture.fromURL(`modules/${CONSTANTS.MODULE_NAME}/assets/${minionTurn}.svg`).then((texture) => {

			const sprite = existingSprite || new PIXI.Sprite(texture);
			sprite.texture = texture;
			sprite.turn = minionTurn;

			if (!existingSprite) {
				sprite.position.set(x, y);
				sprite.width = diameter;
				sprite.height = diameter;
				sprite.minionGroupCircle = true;

				const background = new PIXI.LegacyGraphics()
				background.position.set(x, y);
				background.width = diameter;
				background.height = diameter;
				background.beginFill(0xFFFFFF)
					.drawCircle((diameter / 2), (diameter / 2), Math.max(1, (diameter - 2) / 2))
					.endFill();

				sprite._background = background;

				tokenObject.addChild(background);
				tokenObject.addChild(sprite);
			}

			tokenObject.refresh();

		});
	}
}

export function initializeInitiative() {

	const debouncedTokenCreation = foundry.utils.debounce(async () => {
		if (!game.combats.viewed) return;
		const combatUpdates = {};
		for (const createdToken of tokensCreated) {
			const groupNumber = getProperty(createdToken, CONSTANTS.FLAGS.GROUP_NUMBER);
			if (!groupNumber || !game.combats.viewed) continue;
			const existingCombatant = game.combats.viewed.combatants.find(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
			if (!existingCombatant) continue;
			combatUpdates[existingCombatant.id] = combatUpdates[existingCombatant.id] ?? foundry.utils.deepClone(getProperty(existingCombatant, CONSTANTS.FLAGS.COMBATANTS) ?? []);
			combatUpdates[existingCombatant.id].push(createdToken.uuid);
		}
		await game.combats.viewed.updateEmbeddedDocuments("Combatant", Object.entries(combatUpdates).map(([_id, uuids]) => ({
			_id, [CONSTANTS.FLAGS.COMBATANTS]: uuids
		})));
	}, 250);

	const tokensCreated = [];
	Hooks.on("createToken", (doc) => {
		tokensCreated.push(doc);
		debouncedTokenCreation();
	});

	Hooks.on("deleteCombatant", async (combatant) => {
		const tokenUpdates = [];
		for (const subCombatantUuid of (getProperty(combatant, CONSTANTS.FLAGS.COMBATANTS) ?? [])) {
			const combatantToken = fromUuidSync(subCombatantUuid);
			if (!combatantToken) continue;
			tokenUpdates.push({
				_id: combatantToken.id,
				[CONSTANTS.FLAGS.DELETE_GROUP_NUMBER]: null
			})
		}
		if (tokenUpdates.length) {
			await canvas.scene.updateEmbeddedDocuments("Token", tokenUpdates);
			ui.combat.render(true);
			canvas.scene.tokens.map(refreshInitiativeGroupGraphics);
		}
	});

	Hooks.on("refreshToken", refreshInitiativeGroupGraphics);

	Hooks.on("preCreateCombatant", (doc) => {
		const createdCombatantToken = doc.token;
		const groupNumber = getProperty(createdCombatantToken, CONSTANTS.FLAGS.GROUP_NUMBER);
		if (!groupNumber || !game.combats.viewed) return true;
		return !game.combats.viewed.combatants.some(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
	})

	let tokenBeingDeleted = false;
	Hooks.on("preDeleteToken", (doc) => {
		const groupNumber = getProperty(doc, CONSTANTS.FLAGS.GROUP_NUMBER);
		if (!groupNumber || !game.combats.viewed) return true;
		const tokenCombatant = game.combats.viewed.combatants.find(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
		if(!tokenCombatant) return true;
		tokenBeingDeleted = doc.id;
	});

	Hooks.on("deleteToken", async (doc) => {
		if(doc.id !== tokenBeingDeleted) return;
		const groupNumber = getProperty(doc, CONSTANTS.FLAGS.GROUP_NUMBER);
		const tokenCombatant = game.combats.viewed.combatants.find(combatant => getProperty(combatant.token, CONSTANTS.FLAGS.GROUP_NUMBER) === groupNumber);
		const subCombatants = foundry.utils.deepClone(getProperty(tokenCombatant, CONSTANTS.FLAGS.COMBATANTS) ?? [])
		subCombatants.splice(subCombatants.indexOf(doc.uuid), 1);
		await tokenCombatant.update({
			[CONSTANTS.FLAGS.COMBATANTS]: subCombatants
		});
		ui.combat.render(true);
	});

	Hooks.on("preDeleteCombatant", (combatant) => {
		if (tokenBeingDeleted !== combatant.tokenId) return true;
		const existingSubCombatants = foundry.utils.deepClone(getProperty(combatant, CONSTANTS.FLAGS.COMBATANTS));
		if (!existingSubCombatants?.length) return true;
		const newToken = existingSubCombatants.map(uuid => fromUuidSync(uuid)).filter(foundToken => foundToken?.actor?.id);
		if (!newToken.length) return true;
		combatant.update({
			actorId: newToken[0].actor.id,
			tokenId: newToken[0].id
		});
		return false;
	});

}
