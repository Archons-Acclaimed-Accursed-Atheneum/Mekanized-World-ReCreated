// kubejs/server_scripts/loadbearingframework/material_toxicity.js

var TICKS_PER_SECOND = 20
var EFFECT_REFRESH = 10
var DEBUG = false

// Any ONE complete set protects against all material toxicity.
// Armor prevents NEW contamination; it does not cure existing contamination.
var PROTECTIVE_SETS = [
  {
    name: 'Mekanism MekaSuit',
    head: 'mekanism:mekasuit_helmet',
    chest: 'mekanism:mekasuit_bodyarmor',
    legs: 'mekanism:mekasuit_pants',
    feet: 'mekanism:mekasuit_boots'
  },
  {
    name: 'Mekanism Hazmat',
    head: 'mekanism:hazmat_mask',
    chest: 'mekanism:hazmat_gown',
    legs: 'mekanism:hazmat_pants',
    feet: 'mekanism:hazmat_boots'
  },
  {
    name: 'Nuclear Radiation Hazmat',
    head: 'nuclear_radiation:hazmat_helmet',
    chest: 'nuclear_radiation:hazmat_chestplate',
    legs: 'nuclear_radiation:hazmat_leggings',
    feet: 'nuclear_radiation:hazmat_boots'
  },
  {
    name: 'NuclearCraft HEV Suit',
    head: 'nuclearcraft:hev_helmet',
    chest: 'nuclearcraft:hev_chestplate',
    legs: 'nuclearcraft:hev_leggings',
    feet: 'nuclearcraft:hev_boots'
  }
]

// --------------------------------------------------
// INFECTION PROFILES
// --------------------------------------------------

var INFECTION_PROFILES = {
  neuro: {
    duration: 10 * 60 * TICKS_PER_SECOND,
    stages: [
      {
        at: 40,
        effects: [
          { id: 'minecraft:wither', amp: 2 }
        ]
      },
      {
        at: 180,
        effects: [
          { id: 'minecraft:blindness', amp: 1 },
          { id: 'minecraft:slowness', amp: 2 },
          { id: 'minecraft:mining_fatigue', amp: 2 }
        ]
      },
      {
        at: 420,
        effects: [
          { id: 'minecraft:blindness', amp: 3 },
          { id: 'minecraft:wither', amp: 3 },
          { id: 'minecraft:nausea', amp: 3 },
          { id: 'minecraft:slowness', amp: 4 },
          { id: 'minecraft:mining_fatigue', amp: 4 }
        ]
      }
    ]
  },

  respiratory: {
    duration: null,
    stages: [
      {
        at: 10,
        effects: [
          { id: 'minecraft:poison', amp: 3, permanent: true }
        ]
      },
      {
        at: 30,
        effects: [
          { id: 'minecraft:blindness', amp: 1, permanent: true }
        ]
      },
      {
        at: 60,
        effects: [
          { id: 'minecraft:nausea', amp: 2, permanent: true }
        ]
      },
      {
        at: 1200,
        effects: [
          { id: 'minecraft:nausea', amp: 4, permanent: true }
        ]
      }
    ]
  }
}

var log = function(msg) {
  if (DEBUG) console.info('[MKWRC Toxicity] ' + msg)
}

// --------------------------------------------------
// CHELATION STATE
// --------------------------------------------------

var isChelating = function(player, treatment) {
  var data = player.persistentData

  return data.getInt('mkwrc_chelation_' + treatment + '_delay') === 0 &&
    data.getInt('mkwrc_chelation_' + treatment + '_duration') > 0
}

// --------------------------------------------------
// ARMOR PROTECTION
// --------------------------------------------------

var getStackId = function(stack) {
  if (!stack || stack.isEmpty()) return 'minecraft:air'
  return String(stack.id)
}

var hasFullSet = function(player, armor) {
  return getStackId(player.getHeadArmorItem()) === armor.head &&
    getStackId(player.getChestArmorItem()) === armor.chest &&
    getStackId(player.getLegsArmorItem()) === armor.legs &&
    getStackId(player.getFeetArmorItem()) === armor.feet
}

var isProtected = function(player) {
  for (var i = 0; i < PROTECTIVE_SETS.length; i++) {
    if (hasFullSet(player, PROTECTIVE_SETS[i])) return true
  }

  return false
}

// --------------------------------------------------
// ITEM ID -> TOXIC MATERIALS LOOKUP
// --------------------------------------------------

var toxicMaterials = null
var itemToMaterials = null

var addLookup = function(itemId, material) {
  if (!itemToMaterials[itemId]) itemToMaterials[itemId] = []
  itemToMaterials[itemId].push(material)
}

var buildLookup = function() {
  var materials = global.MATERIALS

  if (!materials) {
    console.error('[MKWRC Toxicity] global.MATERIALS is undefined! Check load order.')
    return
  }

  toxicMaterials = []
  itemToMaterials = {}

  for (var i = 0; i < materials.length; i++) {
    var material = materials[i]
    if (!material.toxicity) continue

    toxicMaterials.push(material)

    addLookup('kubejs:' + material.id + '_dust', material)

    var flags = material.flags || []

    for (var f = 0; f < flags.length; f++) {
      var flag = flags[f]

      if (global.MODIFIER_FLAGS && global.MODIFIER_FLAGS.includes(flag)) continue

      var flagData = global.FLAGS ? global.FLAGS[flag] : null
      if (!flagData) continue

      addLookup('kubejs:' + material.id + '_' + flagData.id, material)
    }

    if (flags.includes('Ingot') && !flags.includes('noHot')) {
      addLookup('kubejs:' + material.id + '_hot_ingot', material)
    }

    if (material.liquid === true) {
      addLookup('kubejs:liquid_' + material.id + '_bucket', material)
    }

    addLookup('kubejs:molten_' + material.id + '_bucket', material)
  }

  log('Lookup built: ' + toxicMaterials.length + ' toxic materials, ' +
    Object.keys(itemToMaterials).length + ' item ids')
}

// --------------------------------------------------
// EFFECT APPLICATION
// --------------------------------------------------

var applyEffect = function(player, effect, amplifier, permanent) {
  player.potionEffects.add(
    effect,
    permanent ? 2147483647 : 100,
    amplifier,
    false,
    true
  )
}

// --------------------------------------------------
// INFECTION MODE
// --------------------------------------------------

var runInfection = function(player, data, material, profile, holding, protectedFromToxicity) {
  var key = 'mkwrc_infect_' + material.id
  var state = data.getInt(key)

  if (state === 0 && holding && !protectedFromToxicity) {
    state = 1
    log(player.username + ' CONTAMINATED by ' + material.id)
  }

  if (state === 0) return

  // Neuro chelation reverses the infection clock at 20x speed.
  if (material.toxicity.type === 'neuro' && isChelating(player, 'neuro')) {
    state = Math.max(0, state - EFFECT_REFRESH * 20)

    data.putInt(key, state)

    if (state === 0) {
      log(player.username + ' recovered from neuro poisoning')
    }

    return
  }

  state = Math.min(state + EFFECT_REFRESH, 1000000)

  var seconds = state / TICKS_PER_SECOND

  for (var s = 0; s < profile.stages.length; s++) {
    var stage = profile.stages[s]
    if (seconds < stage.at) continue

    for (var e = 0; e < stage.effects.length; e++) {
      var fx = stage.effects[e]
      applyEffect(player, fx.id, fx.amp, fx.permanent === true)
    }
  }

  if (profile.duration !== null && state >= profile.duration) {
    log(player.username + ' recovered from ' + material.id + ' poisoning')
    state = 0
  }

  data.putInt(key, state)
}

// --------------------------------------------------
// EXPOSURE MODE
// --------------------------------------------------

var applyToxicityEffects = function(player, toxicity, exposure, materialId) {
  var seconds = exposure / TICKS_PER_SECOND
  var type = toxicity.type

  if (type === 'poison') {
    var threshold = (toxicity.threshold !== undefined && toxicity.threshold !== null)
      ? toxicity.threshold
      : 30

    if (seconds >= threshold) {
      if (toxicity.permanent === true) {
        applyEffect(player, 'minecraft:poison', 3, true)
      } else {
        applyEffect(player, 'minecraft:poison', 2, false)
      }
    }

    return
  }

  if (type === 'nausea') {
    applyEffect(player, 'minecraft:nausea', 2, false)
    return
  }

  // Neutronium toxicity.
  // Check the material ID so this also works if its type is systemic.
  if (type === 'neutronium' || materialId === 'neutronium') {
    if (seconds >= 90) {
      applyEffect(player, 'minecraft:weakness', 2, false)
      applyEffect(player, 'minecraft:slowness', 2, false)
      applyEffect(player, 'minecraft:wither', 2, false)
    }

    return
  }

  // Arsenic systemic toxicity.
  if (type === 'systemic') {
    if (seconds >= 40) {
      var amplifier = Math.floor((seconds - 40) / 30) + 1
      applyEffect(player, 'minecraft:poison', amplifier, false)
    }

    return
  }

  console.error('[MKWRC Toxicity] Unknown toxicity type "' + type + '" on material "' + materialId + '"')
}

var runExposure = function(player, data, material, holding, protectedFromToxicity) {
  var key = 'mkwrc_toxicity_' + material.id
  var exposure = data.getInt(key)

  // Arsenic chelation reverses exposure at 20x normal decay.
  if (material.toxicity.type === 'systemic' && isChelating(player, 'systemic')) {
    exposure = Math.max(0, exposure - EFFECT_REFRESH * 10)

    // Continue refreshing arsenic effects only while the threshold is met.
    if (holding && exposure > 0) {
      applyToxicityEffects(player, material.toxicity, exposure, material.id)
    }
  } else if (holding && !protectedFromToxicity) {
    exposure += EFFECT_REFRESH

    if (exposure % 300 === 0) {
      log(player.username + ' exposed to ' + material.id + ': ' +
        (exposure / TICKS_PER_SECOND) + 's')
    }

    applyToxicityEffects(player, material.toxicity, exposure, material.id)
  } else if (exposure > 0) {
    exposure = Math.max(0, exposure - EFFECT_REFRESH / 2)
  }

  if (exposure !== data.getInt(key)) {
    data.putInt(key, exposure)
  }
}

// --------------------------------------------------
// DEBUG CURE
// --------------------------------------------------

var cureEverything = function(player, data) {
  var cleared = false

  for (var i = 0; i < toxicMaterials.length; i++) {
    var keys = [
      'mkwrc_infect_' + toxicMaterials[i].id,
      'mkwrc_toxicity_' + toxicMaterials[i].id
    ]

    for (var k = 0; k < keys.length; k++) {
      if (data.contains(keys[k])) {
        data.remove(keys[k])
        cleared = true
      }
    }
  }

  if (cleared) {
    player.removeAllEffects()
    log(player.username + ' cured (creative mode, DEBUG)')
  }
}

// --------------------------------------------------
// PLAYER TICK
// --------------------------------------------------

var tickToxicity = function(player) {
  if (player.level.clientSide) return

  if (toxicMaterials === null) buildLookup()
  if (toxicMaterials === null || toxicMaterials.length === 0) return

  var data = player.persistentData

  if (DEBUG && player.isCreative()) {
    cureEverything(player, data)
    return
  }

  var protectedFromToxicity = isProtected(player)

  var heldIds = [
    getStackId(player.mainHandItem),
    getStackId(player.offHandItem)
  ]

  var heldMaterials = {}

  for (var h = 0; h < heldIds.length; h++) {
    var matches = itemToMaterials[heldIds[h]]
    if (!matches) continue

    for (var m = 0; m < matches.length; m++) {
      heldMaterials[matches[m].id] = matches[m]
    }
  }

  if (DEBUG && player.tickCount % 300 === 0) {
    log('heartbeat | main=' + heldIds[0] + ' off=' + heldIds[1] +
      ' | toxic held=' + Object.keys(heldMaterials).join(',') +
      ' | protected=' + protectedFromToxicity +
      ' | toxic materials=' + toxicMaterials.length)
  }

  for (var i = 0; i < toxicMaterials.length; i++) {
    var material = toxicMaterials[i]
    var holding = heldMaterials[material.id] !== undefined
    var profile = INFECTION_PROFILES[material.toxicity.type]

    if (profile) {
      runInfection(player, data, material, profile, holding, protectedFromToxicity)
    } else {
      runExposure(player, data, material, holding, protectedFromToxicity)
    }
  }
}

PlayerEvents.tick(event => {
  var player = event.player

  if (player.tickCount % EFFECT_REFRESH !== 0) return

  try {
    tickToxicity(player)
  } catch (e) {
    console.error('[MKWRC Toxicity] tick crashed: ' + e +
      (e && e.stack ? '\n' + e.stack : ''))
  }
})