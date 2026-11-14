// kubejs/server_scripts/loadbearingframework/material_chelation.js

var CHELATION_DELAY = 100       // 5 seconds
var CHELATION_DURATION = 7200   // 360 seconds
var CHELATION_INTERVAL = 30     // 1.5 seconds

// Normal toxicity decay: 15 points per interval.
// 20x total decay: 300 points.
// The toxicity script already removes 15, so we remove 285 extra.

var CHELATION_REDUCTION = 285

var TREATMENTS = {
  systemic: {
    item: 'kubejs:pyrite_chelation_syringe',
    toxicity: 'mkwrc_toxicity_systemic'
  },

  neuro: {
    item: 'kubejs:sodium_hydrosulfide_chelation_syringe',
    toxicity: 'mkwrc_toxicity_neuro'
  }
}

// START TREATMENT
var startChelation = function(player, treatment) {
  var data = player.persistentData
  var prefix = 'mkwrc_chelation_' + treatment + '_'

  data.putInt(prefix + 'delay', CHELATION_DELAY)
  data.putInt(prefix + 'duration', 0)
  data.putInt(prefix + 'interval', 0)

  player.tell('§bChelation initiated. Treatment begins in 5 seconds.')

  console.info(
    '[MKWRC Chelation] ' + player.username +
    ' consumed ' + treatment + ' treatment'
  )
}

// CONSUMABLE HANDLERS
ItemEvents.foodEaten(TREATMENTS.systemic.item, event => {
  startChelation(event.player, 'systemic')
})

ItemEvents.foodEaten(TREATMENTS.neuro.item, event => {
  startChelation(event.player, 'neuro')
})

// PROCESS TREATMENT
PlayerEvents.tick(event => {
  var player = event.player

  if (player.level.clientSide) return

  var data = player.persistentData

  for (var treatment in TREATMENTS) {
    var prefix = 'mkwrc_chelation_' + treatment + '_'

    var delay = data.getInt(prefix + 'delay')
    var duration = data.getInt(prefix + 'duration')
    var interval = data.getInt(prefix + 'interval')

    // Waiting for treatment to begin.
    if (delay > 0) {
      delay--

      if (delay === 0) {
        duration = CHELATION_DURATION
        player.tell('§bChelation treatment activated!')
      }
    }

    // Active treatment.
    else if (duration > 0) {
      duration--
      interval++

      if (interval >= CHELATION_INTERVAL) {
        interval = 0

        var toxicityKey = TREATMENTS[treatment].toxicity
        var exposure = data.getInt(toxicityKey)

        exposure = Math.max(0, exposure - CHELATION_REDUCTION)

        data.putInt(toxicityKey, exposure)
      }

      if (duration === 0) {
        player.tell('§7Chelation treatment completed.')
      }
    }

    data.putInt(prefix + 'delay', delay)
    data.putInt(prefix + 'duration', duration)
    data.putInt(prefix + 'interval', interval)
  }
})
