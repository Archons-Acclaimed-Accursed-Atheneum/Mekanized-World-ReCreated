// kubejs/client_scripts/rainbowvomit.js

// ============================================================
// SUBSCRIPT UTILITIES
// ============================================================

var SUBSCRIPTS = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
}

var formatSubscript = function(amount) {
  return String(amount).split('').map(function(char) {
    return SUBSCRIPTS[char] || char
  }).join('')
}

// ============================================================
// FLAG DISPLAY NAMES
// ============================================================

var FLAG_DISPLAY_NAMES = {
  DoublePlate: 'Double Plate',
  SmallGear: 'Small Gear',
  DensePlate: 'Dense Plate',
  LongRod: 'Long Rod',
  NanoSwarm: 'Nano Swarm'
}

// ============================================================
// CHROMATIC COLOR REGISTRATION
// ============================================================

ChromaticEvents.clientRegister(event => {
  for (var mat of global.MATERIALS) {
    event.color('[' + mat.id + ']', mat.color)
  }
})

// ============================================================
// LANG / DISPLAY NAME COLORING
// ============================================================

ClientEvents.lang('en_us', event => {
  for (var mat of global.MATERIALS) {
    var prefix = '&[' + mat.id + ']'

    // Dust
    if (!mat.flags.includes('noDust')) {
      event.renameItem(
        'kubejs:' + mat.id + '_dust',
        prefix + mat.display + ' Dust'
      )
    }

    var itemFlags = mat.flags.filter(function(f) {
      return !global.MODIFIER_FLAGS.includes(f)
    })

    // Material forms
    for (var flag of itemFlags) {
      var flagData = global.FLAGS[flag]
      if (!flagData || flag === 'Block') continue

      var displayFlag = FLAG_DISPLAY_NAMES[flag] || flag

      event.renameItem(
        'kubejs:' + mat.id + '_' + flagData.id,
        prefix + mat.display + ' ' + displayFlag
      )
    }

        if (itemFlags.includes('Block')) {
      event.renameItem(
        'kubejs:' + mat.id + '_block',
        prefix + mat.display + ' Block'
      )
    }
  

    // Hot ingot
    if (itemFlags.includes('Ingot') && !mat.flags.includes('noHot')) {
      event.renameItem(
        'kubejs:' + mat.id + '_hot_ingot',
        prefix + mat.display + ' Hot Ingot'
      )
    }

    // Gem
    if (mat.form === 'gem') {
      event.renameItem(
        'kubejs:' + mat.id + '_gem',
        prefix + mat.display
      )
    }

    // Fluid buckets and fluid names
    if (mat.liquid === true) {
      event.add(
        'fluid_type.kubejs.liquid_' + mat.id,
        prefix + 'Liquid ' + mat.display
      )

      event.renameItem(
        'kubejs:liquid_' + mat.id + '_bucket',
        prefix + 'Liquid ' + mat.display + ' Bucket'
      )
    }
    
    if (mat.molten === true) {
      event.add(
        'fluid_type.kubejs.molten_' + mat.id,
        prefix + 'Molten ' + mat.display
      )

      event.renameItem(
        'kubejs:molten_' + mat.id + '_bucket',
        prefix + 'Molten ' + mat.display + ' Bucket'
      )
    } 
    
    if (mat.gaseous === true) {
      event.add(
        'fluid_type.kubejs.' + mat.id,
        prefix + mat.display
      )

      event.renameItem(
        'kubejs:' + mat.id + '_bucket',
        prefix + mat.display + ' Bucket'
      )
    }
  }
})

// ============================================================
// TOOLTIP HELPERS
// ============================================================

var formatCompositionText = function(mat, depth) {
  if (!mat || !mat.composition || depth > 20) return null

  var result = Text.of('')

  for (var part of mat.composition) {
    var component = global.MATERIALS.find(function(m) {
      return m.id === part[0]
    })

    if (!component) {
      console.error('[MKWRC Composition] ' + mat.id + ': invalid reference ' + part[0])
      continue
    }

    var amount = part[1]

    if (component.element) {
      result = result.append(
        Text.of(component.element).color(component.color)
      )
    } else {
      var nested = formatCompositionText(component, depth + 1)
      if (!nested) continue

      result = result
        .append(Text.of('(').white())
        .append(nested)
        .append(Text.of(')').white())
    }

    if (amount !== 1) {
      result = result.append(
        Text.of(formatSubscript(amount)).white()
      )
    }
  }

  return result
}

var createComposition = function(mat) {
  if (mat.element) {
    return Text.of('Element: ').darkGray()
      .append(Text.of(mat.element).color(mat.color))
  }

  if (!mat.composition) return null

  var formula = formatCompositionText(mat, 0)
  if (!formula) return null

  return Text.of('').yellow().append(formula)
}

var createTemperatureTooltip = function(mat) {
  var temp = mat.temperature == null || mat.temperature <= 0
    ? 303
    : mat.temperature

  if (temp < 100) {
    return Text.of('Temperature: ' + temp + ' K (Cryogenic)').darkAqua()
  } else if (temp < 223) {
    return Text.of('Temperature: ' + temp + ' K (Cold)').aqua()
  } else if (temp <= 1200) {
    return Text.of('Temperature: ' + temp + ' K').darkGray()
  } else if (temp <= 1800) {
    return Text.of('Temperature: ' + temp + ' K (Molten)').red()
  } else {
    return Text.of('Temperature: ' + temp + ' K (Plasma)').gold()
  }
}

var createToxicityTooltip = function(mat) {
  if (!mat.toxicity) return null

  var messages = {
  respiratory:  'Toxic: Permanent Poison after 10 seconds',
  systemic:    'Toxic: Escalating Poison after 40 seconds (every 30 seconds)',
  nausea:     'Toxic: Causes immediate Nausea',
  neuro:    'Toxic: Wither after 40 seconds; additional effects after 180 and 420 seconds',
  neutronium: 'Toxic: Weakness, Slowness and Wither after 90 seconds'
}

  var message = messages[mat.toxicity.type]
  if (!message) return null

  return Text.of(message).red()
}

var createMaterialTooltip = function(mat) {
  var tooltip = []

  var composition = createComposition(mat)
  if (composition) tooltip.push(composition)

  tooltip.push(createTemperatureTooltip(mat))

  var toxicity = createToxicityTooltip(mat)
  if (toxicity) tooltip.push(toxicity)

  return tooltip
}

// ============================================================
// ITEM TOOLTIP REGISTRATION
// ============================================================

ItemEvents.modifyTooltips(event => {
  for (var mat of global.MATERIALS) {
    var tooltip = createMaterialTooltip(mat)

        // Dust
    if (!mat.flags.includes('noDust')) {
      event.add('kubejs:' + mat.id + '_dust', tooltip)
    }

    var itemFlags = mat.flags.filter(function(f) {
      return !global.MODIFIER_FLAGS.includes(f)
    })

    // Material forms
    for (var i = 0; i < itemFlags.length; i++) {
      var flag = itemFlags[i]
      var flagData = global.FLAGS[flag]

      if (!flagData) continue

      event.add('kubejs:' + mat.id + '_' + flagData.id, tooltip)
    }

    

    // Hot ingots
    if (itemFlags.includes('Ingot') && !mat.flags.includes('noHot')) {
      event.add('kubejs:' + mat.id + '_hot_ingot', tooltip)
    }

    // Gems
    if (mat.form === 'gem') {
      event.add('kubejs:' + mat.id + '_gem', tooltip)
    }

    // Fluid buckets
    var bucketId = null

    if (mat.liquid === true) {
      bucketId = 'kubejs:liquid_' + mat.id + '_bucket'
    } else if (mat.molten === true) {
      bucketId = 'kubejs:molten_' + mat.id + '_bucket'
    }

    if (bucketId) {
      event.add(bucketId, tooltip)
    }
  }

  // darrel
  event.add('kubejs:darrel', Text.of('Composition: :3').yellow())
})