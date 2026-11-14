// kubejs/server_scripts/loadbearingframework/material_freezing.js

// ============================================
// Configuration
// ============================================

var FREEZING_EFFECT = 'ars_nouveau:freezing'

var FREEZING_BUILDUP_TICKS = 100 // 5 seconds per level
var FREEZING_DECAY_TICKS = 20    // 1 level per second
var EFFECT_REFRESH_TICKS = 40

var DEBUG = false

// ============================================
// Persistent data keys
// ============================================

var DATA_LEVEL = 'mkwrc_freezing_level'
var DATA_BUILDUP = 'mkwrc_freezing_buildup'
var DATA_DECAY = 'mkwrc_freezing_decay'

// ============================================
// Cryogenic bucket lookup
// ============================================

var cryogenicBuckets = {}

var buildLookup = function() {
  cryogenicBuckets = {}

  if (!global.MATERIALS) {
    console.error('[MKWRC Freezing] global.MATERIALS is missing!')
    return
  }

  for (var mat of global.MATERIALS) {
    // Match the temperature fallback used by material tooltips.
    var temperature = mat.temperature == null || mat.temperature <= 0
      ? 303
      : Number(mat.temperature)

    if (!Number.isFinite(temperature) || temperature >= 100) {
      continue
    }

    var bucketId = null

    if (mat.liquid === true) {
      bucketId = 'kubejs:liquid_' + mat.id + '_bucket'
    } else if (mat.molten === true) {
      bucketId = 'kubejs:molten_' + mat.id + '_bucket'
    }

    if (bucketId == null) {
      continue
    }

    cryogenicBuckets[bucketId] = temperature

    console.info(
      '[MKWRC Freezing] Registered cryogenic bucket: ' +
      bucketId + ' (' + temperature + ' K)'
    )
  }

  console.info(
    '[MKWRC Freezing] Registered ' +
    Object.keys(cryogenicBuckets).length +
    ' cryogenic buckets.'
  )
}

buildLookup()

// ============================================
// Helpers
// ============================================

var getBucketTemperature = function(stack) {
  if (!stack || stack.empty) {
    return null
  }

  var id = String(stack.id)

  return cryogenicBuckets[id] == null
    ? null
    : cryogenicBuckets[id]
}

var isHoldingCryogenicBucket = function(player) {
  var mainHand = player.mainHandItem
  var offHand = player.offHandItem

  return getBucketTemperature(mainHand) != null ||
    getBucketTemperature(offHand) != null
}

var updateFreezingEffect = function(player, level) {
  if (level <= 0) {
    player.removeEffect(FREEZING_EFFECT)
    return
  }

  player.potionEffects.add(
    FREEZING_EFFECT,
    EFFECT_REFRESH_TICKS,
    Math.min(level - 1, 255),
    false,
    true
  )
}

// ============================================
// Player freezing
// ============================================

PlayerEvents.tick(event => {
  var player = event.player

  if (player.level.isClientSide()) {
    return
  }

  var data = player.persistentData

  var level = data.getInt(DATA_LEVEL)
  var buildup = data.getInt(DATA_BUILDUP)
  var decay = data.getInt(DATA_DECAY)

  var holdingCryogenic = isHoldingCryogenicBucket(player)

  if (holdingCryogenic) {
    // ========================================
    // Build up freezing
    // ========================================

    decay = 0
    buildup++

    if (buildup >= FREEZING_BUILDUP_TICKS) {
      buildup = 0
      level++

      if (DEBUG) {
        console.info(
          '[MKWRC Freezing] ' +
          player.username + ' reached freezing level ' + level
        )
      }
    }
  } else {
    // ========================================
    // Decay freezing
    // ========================================

    buildup = 0

    if (level > 0) {
      decay++

      if (decay >= FREEZING_DECAY_TICKS) {
        decay = 0
        level--

        if (DEBUG) {
          console.info(
            '[MKWRC Freezing] ' +
            player.username + ' decreased to freezing level ' + level
          )
        }
      }
    } else {
      decay = 0
    }
  }

  // ========================================
  // Save persistent data
  // ========================================

  data.putInt(DATA_LEVEL, level)
  data.putInt(DATA_BUILDUP, buildup)
  data.putInt(DATA_DECAY, decay)

  // ========================================
  // Apply effect
  // ========================================

  if (event.server && event.server.tickCount % 20 === 0) {
    updateFreezingEffect(player, level)
  }
})