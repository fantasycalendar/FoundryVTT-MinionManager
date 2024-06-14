import CONSTANTS from "./constants.js";
import * as lib from "./lib.js";
import * as api from "./api.js";

export function registerSheetOverrides() {
    Hooks.on("renderItemSheet5e", patchItemSheet);
    Hooks.on("tidy5e-sheet.renderItemSheet", patchTidyItemSheet);
}

function patchItemSheet(app, html, { item } = {}) {
    if (!app.options.classes.includes("tidy5e-sheet")) {
        patchGroupAttack(html, item);
        patchDCScaling(html, item);
    }
}

function patchTidyItemSheet(app, element, { item }, forced) {
    patchTidyGroupAttack(element, item);
    patchTidyDCScaling(element, item);
}

function patchGroupAttack(html, item) {
    if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS) && api.isMinion(item.parent)) {
        if (["feat", "weapon", "spell"].includes(item.type)) {
            const featureHeader = game.i18n.localize("DND5E.FeatureUsage");
            const weaponHeader = game.i18n.localize("DND5E.ItemWeaponUsage");
            const spellHeader = game.i18n.localize("DND5E.SpellCastingHeader");
            let targetElem = html.find(`
                .form-header:contains(${featureHeader}),
                .form-header:contains(${weaponHeader}),
                .form-header:contains(${spellHeader})`)[0];
            if (!targetElem) return;
            $(getGroupAttackHtml(item)).insertBefore(targetElem);
        }
    }
}

function patchTidyGroupAttack(element, item) {
    if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_ATTACKS) && api.isMinion(item.parent)) {
        const html = $(element);
        const markupToInject = `
            <div style="display: contents;" data-tidy-render-scheme="handlebars">
                ${getGroupAttackHtml(item)}
            </div>
        `;
        if (["feat", "weapon", "spell"].includes(item.type)) {
            const featureHeader = game.i18n.localize("DND5E.FeatureUsage");
            const weaponHeader = game.i18n.localize("DND5E.ItemWeaponUsage");
            const spellHeader = game.i18n.localize("DND5E.SpellCastingHeader");
            let targetElem = html.find(`
                .form-header:contains(${featureHeader}),
                .form-header:contains(${weaponHeader}),
                .form-header:contains(${spellHeader})`)[0];
            if (!targetElem) return;
            $(markupToInject).insertBefore(targetElem);
        }
    }
}

function patchDCScaling(html, item) {
    if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_DC_BONUS) && getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK)) {
        let targetElem = html.find('[name="system.save.ability"]')?.parent()?.parent()?.[0];
        if (!targetElem) return;
        $(getDCScalingHtml(item)).insertAfter(targetElem);
    }
}

function patchTidyDCScaling(element, item) {
    if (lib.getSetting(CONSTANTS.SETTING_KEYS.ENABLE_GROUP_DC_BONUS) && getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK)) {
        const html = $(element);
        const markupToInject = `
            <div style="display: contents;" data-tidy-render-scheme="handlebars">
                ${getDCScalingHtml(item)}
            </div>
        `;
        let targetElem = html.find('[data-tidy-field="system.save.ability"]')?.parent()?.parent()?.[0];
        if (!targetElem) return;
        $(markupToInject).insertAfter(targetElem);
    }
}

function getGroupAttackHtml(item) {
    const groupAttackEnabled = foundry.utils.getProperty(item, CONSTANTS.FLAGS.MIDI_GROUP_ATTACK) ?? false;
    let idealWidth = Math.ceil((1.2 * game.i18n.localize("MINIONMANAGER.ItemOverrides.Enabled").length) + 3);
    return `
        <div class="form-group" title="Module: Minion Manager">
            <label>${game.i18n.localize("MINIONMANAGER.ItemOverrides.GroupAttack")} <i class="fas fa-info-circle"></i></label>
            <div class="form-fields">
                <label class="checkbox" style="width: ${idealWidth ?? 12}ch">
                    <input type="checkbox" name="${CONSTANTS.FLAGS.MIDI_GROUP_ATTACK}" ${groupAttackEnabled ? "checked" : ""}>
                    ${game.i18n.localize("MINIONMANAGER.ItemOverrides.Enabled")}
                </label>
            </div>
        </div>
    `
}

function getDCScalingHtml(item) {
    const dcScalingEnabled = foundry.utils.getProperty(item, `${CONSTANTS.FLAGS.DC_SCALING_ENABLED}`) ?? false;
    let idealWidth = Math.ceil((1.2 * game.i18n.localize("MINIONMANAGER.ItemOverrides.Enabled").length) + 3);
    return `
        <div class="form-group" title="Module: Minion Manager" style="display:${item.system.hasSave ? "flex" : "none"}">
            <label>${game.i18n.localize("MINIONMANAGER.ItemOverrides.ScaleDC")} <i class="fas fa-info-circle"></i></label>
            <div class="form-fields">
                <label class="checkbox" style="width: ${idealWidth ?? 12}ch">
                    <input type="checkbox" name="${CONSTANTS.FLAGS.DC_SCALING_ENABLED}" ${dcScalingEnabled ? "checked" : ""}>
                    ${game.i18n.localize("MINIONMANAGER.ItemOverrides.Enabled")}
                </label>
            </div>
        </div>
    `;
}