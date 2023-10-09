# Minion Manager

![Latest Release Download Count](https://img.shields.io/github/downloads/fantasycalendar/FoundryVTT-MinionManager/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fminionmanager&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=minionmanager) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2Ffantasycalendar%2FFoundryVTT-MinionManager%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange&style=for-the-badge) ![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2Ffantasycalendar%2FFoundryVTT-MinionManager%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

---

<img src="https://app.fantasy-calendar.com/resources/computerworks-logo-full.png" alt="Fantasy Computerworks Logo" style="width:250px;"/>

A module made by [Fantasy Computerworks](http://fantasycomputer.works/).

Other works by us:

- [Fantasy Calendar](https://app.fantasy-calendar.com) - The best calendar creator and management app on the internet
- [Sequencer](https://foundryvtt.com/packages/sequencer) - Wow your players by playing visual effects on the canvas
- [Item Piles](https://foundryvtt.com/packages/item-piles) - Drag & drop items into the scene to drop item piles that you can then easily pick up
- [Tagger](https://foundryvtt.com/packages/tagger) - Tag objects in the scene and retrieve them with a powerful API
- [Rest Recovery](https://foundryvtt.com/packages/rest-recovery) - Automate most D&D 5e long and short rest mechanics
- [Token Ease](https://foundryvtt.com/packages/token-ease) - Make your tokens _feel good_ to move around on the board

Like what we've done? Buy us a coffee!

<a href='https://ko-fi.com/H2H2LCCQ' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

---

## What is this module?

Minion Manager is a module that automates the MCDM "Flee, Mortals!" minion rules. This includes:

- Overkill damage from melee and ranged weapons
- Minion group attacks
- Group-style initiative

These are all configurable through the module's settings.

## Minions & Group Attacks

You can right-click on actors to turn them into minions, and then right-click on their attacks to turn them into group attacks.

![Turning a token into a minion](docs/right-click-actor.png) ![Turning a minion's attack into a group attack](docs/right-click-item.png)

You can also include the identifier `@numberOfMinions` anywhere in the attacks to reference the number of minion attacking. 

**Note:** This is automatically included in any damage part that does not already have it. 

![Number of minions modifier in the damage](docs/number-of-minions.png)

## Group Initiative

You can set this by right-clicking on the token HUD's "add to initiative" button to open the group initiative interface - clicking on a number within that UI moves all the selected tokens into that initiative group.

Reducing or deleting any characters of a group does not affect the combat tracker, unless all of them are deleted or marked as defeated.

## Where can I find the minion rules?

You can find the full MCDM book here:

https://shop.mcdmproductions.com/collections/flee-mortals-the-mcdm-monster-book

Or the preview packet for the minion rules here:

https://files.mcdmproductions.com/FleeMortals/FleeMortalsPreview.pdf

# Documentation

## API

You can access the API through `game.modules.get("minionmanager").api`

## Functions

<a name="setGroupInitiative"></a>

### setGroupInitiative

<code>game.modules.get("minionmanager").api.setGroupInitiative(targets, groupNumber) ⇒ boolean | Promise&lt;Array&lt;Document&lt;any, Scene&gt;&gt;&gt;</code>

Sets the group initiative of a set of tokens or actors.

**Kind**: global function

| Param | Type                                                                                         | Description                                          |
| --- |----------------------------------------------------------------------------------------------|------------------------------------------------------|
| targets | <code>Array&lt;string/Token/TokenDocument/Actor&gt;/Atring/Token/TokenDocument/Actor</code>  | The targets to add to the group initiative |
| groupNumber | <code>Number</code>                                                                          | The group initiative to set on the targets           |

<a name="removeGroupInitiative"></a>

### removeGroupInitiative

<code>game.modules.get("minionmanager").api.removeGroupInitiative(targets) ⇒ boolean | Promise&lt;Array&lt;Document&lt;any, Scene&gt;&gt;&gt;</code>

Removes the group initiative of a set of tokens or actors.

**Kind**: global function

| Param | Type | Description |
| --- | --- |-------------|
| targets | <code>Array&lt;string/Token/TokenDocument/Actor&gt;/Atring/Token/TokenDocument/Actor</code> | The targets to remove the group initiative from |


<a name="getActors"></a>

### getActors

<code>game.modules.get("minionmanager").api.getActors(targets) ⇒ Array&lt;Actor&gt;</code>

Helper function - turns a list of UUID strings/tokens/token documents into a list of the respective actors

**Kind**: global function

| Param | Type                                                                                         |
| --- |----------------------------------------------------------------------------------------------|
| targets | <code>Array&lt;string/Token/TokenDocument/Actor&gt;/Atring/Token/TokenDocument/Actor</code> |

<a name="turnIntoMinions"></a>

### turnIntoMinions

<code>game.modules.get("minionmanager").api.turnIntoMinions(actors) ⇒ Promise&lt;void&gt;</code>

Turns the given actors into minions by creating a minion feature document on the actor.

**Kind**: global function

| Param | Type                                                                                         |
| --- |----------------------------------------------------------------------------------------------|
| actors | <code>Array&lt;string/Token/TokenDocument/Actor&gt;String/Token/TokenDocument/Actor</code> |

<a name="revertMinions"></a>

### revertMinions

<code>game.modules.get("minionmanager").api.revertMinions(actors) ⇒ Promise&lt;void&gt;</code>

Removes the minion feature from a set of actors, turning them back into normal actors.

**Kind**: global function

| Param | Type                                                                                     |
| --- |------------------------------------------------------------------------------------------|
| actors | <code>Array&lt;string/Token/TokenDocument/Actor&gt;stringTokenTokenDocumentActor</code> |

<a name="isMinion"></a>

### isMinion

<code>game.modules.get("minionmanager").api.isMinion(target) ⇒ boolean</code>

Helper function - returns true or false whether the given target is a minion or not

**Kind**: global function

| Param |
| --- |
| target |

<a name="setActorItemToGroupAttack"></a>

### setActorItemToGroupAttack

<code>game.modules.get("minionmanager").api.setActorItemToGroupAttack(item, isGroupAttack) ⇒ Promise&lt;Item&gt;</code>

Helper function - sets the given item to become a group attack type feature

**Kind**: global function

| Param | Type |
| --- | --- |
| item | <code>Item</code> |
| isGroupAttack | <code>boolean</code> |

<a name="isItemGroupAttack"></a>

### isItemGroupAttack

<code>game.modules.get("minionmanager").api.isItemGroupAttack(item) ⇒ boolean</code>

Helper function - returns whether the given item is a group attack type feature

**Kind**: global function

| Param | Type |
| --- | --- |
| item | <code>Item</code> |

<a name="turnActorAttacksIntoGroupActions"></a>

### turnActorAttacksIntoGroupActions

<code>game.modules.get("minionmanager").api.turnActorAttacksIntoGroupActions(actors) ⇒ Promise&lt;void&gt;</code>

Turns every feature or item on a given actor into group attack type features

**Kind**: global function

| Param | Type |
| --- | --- |
| actors | <code>Array&lt;Actor&gt;</code> |

<a name="revertActorAttacksFromGroupActions"></a>

### revertActorAttacksFromGroupActions

<code>game.modules.get("minionmanager").api.revertActorAttacksFromGroupActions(actors) ⇒ Promise&lt;void&gt;</code>

Reverts every feature or item on a given actor back into a normal item from being a group attack type feature

**Kind**: global function

| Param | Type |
| --- | --- |
| actors | <code>Array&lt;Actor&gt;</code> |
