// kubejs/server_scripts/loadbearingframework/autorecipes.js
const $BuiltInRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

const $ResourceLocation = Java.loadClass(
  'net.minecraft.resources.ResourceLocation'
)

ServerEvents.recipes(auto => {
  // --------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------

  var EARLY_MATERIALS = [
    'iron',
    'steel',
    'copper',
    'bronze',
    'brass',
    'gold',
    'zinc',
    'igneous_alloy'
  ]

  // Create spout amounts.
  var LAVA_AMOUNT = 50
  var WATER_AMOUNT = 50

  // NuclearCraft base processing values.
  var BASE_ENERGY = 20
  var BASE_DURATION = 100

  // Explicit mappings: do not depend on an undocumented global.FLAGS table.
  var ITEM_SUFFIXES = {
    Ingot: 'ingot',
    Plate: 'plate',
    Rod: 'rod',
    LongRod: 'long_rod',
    DoublePlate: 'double_plate',
    DensePlate: 'dense_plate',
    Wire: 'wire',
    Spool: 'wire_spool',
    Foil: 'foil',
    Bolt: 'bolt',
    Screw: 'screw',
    Gear: 'gear',
    SmallGear: 'small_gear',
    Nugget: 'nugget',
    Block: 'block',
    Nanoswarm: 'nanoswarm'
  }

  // --------------------------------------------------
  // MATERIAL HELPERS
  // --------------------------------------------------

  var has = function(mat, flag) {
    return mat.flags && mat.flags.indexOf(flag) !== -1
  }

  var isEarly = function(mat) {
    return EARLY_MATERIALS.indexOf(mat.id) !== -1
  }

  var isGem = function(mat) {
    return String(mat.form || '').toLowerCase() === 'gem'
  }

  var item = function(mat, flag) {
    if (flag === 'Dust') {
      return 'kubejs:' + mat.id + '_dust'
    }

    // Gem-form materials use their dedicated gem item.
    if (flag === 'Ingot' && isGem(mat)) {
      return 'kubejs:' + mat.id + '_gem'
    }

    var suffix = ITEM_SUFFIXES[flag]
    if (!suffix) {
      throw new Error('[MKWRC AutoRecipes] Unknown item flag: ' + flag)
    }

    return 'kubejs:' + mat.id + '_' + suffix
  }

  var processing = function(mat) {
    var energy = mat.processing && mat.processing.energy != null
      ? mat.processing.energy
      : 1

    var duration = mat.processing && mat.processing.duration != null
      ? mat.processing.duration
      : 1

    return {
      energy_per_tick: Math.max(1, Math.round(BASE_ENERGY * energy)),
      process_time: Math.max(1, Math.round(BASE_DURATION * duration))
    }
  }

  // Internally generated material recipes use exact item IDs, not tags.
  var itemInput = function(mat, flag, count) {
    return {
      count: count || 1,
      item: item(mat, flag)
    }
  }

  var itemOutput = function(mat, flag, count) {
    return {
      count: count || 1,
      item: item(mat, flag)
    }
  }

  var ncRecipe = function(type, mat, inputs, outputFlag, outputCount) {
    var stats = processing(mat)

    auto.custom({
      type: type,
      energy_per_tick: stats.energy_per_tick,
      process_time: stats.process_time,
      item_inputs: inputs,
      item_outputs: [
        itemOutput(mat, outputFlag, outputCount)
      ]
    })
  }


  var presserRecipe = function(
    mat,
    primary, primaryCount,
    secondary, secondaryCount,
    tertiary, tertiaryCount,
    outputFlag
  ) {
    auto.custom({
      type: 'mekmm:pressing',

      primary_input: {
        count: primaryCount,
        item: item(mat, primary)
      },

      secondary_input: {
        count: secondaryCount,
        item: item(mat, secondary)
      },

      tertiary_input: {
        count: tertiaryCount,
        item: item(mat, tertiary)
      },

      output: {
        count: 1,
        id: item(mat, outputFlag)
      }
    })
  }

  // MekMM Stamper uses ItemStackIngredient inputs and an ItemStack output.
var stamperRecipe = function(output, input, inputCount, mold) {
  auto.custom({
    type: 'mekmm:stamper',
    input: {
      item: input,
      count: inputCount
    },
    mold: {
      item: mold,
      count: 1
    },
    output: {
      id: output,
      count: 1
    }
  })
}



  // --------------------------------------------------
  // CREATE SEQUENCED ASSEMBLY HELPERS
  // --------------------------------------------------

var fillStep = function(transitional, fluid, amount) {
  return auto.recipes.createFilling(transitional, [
    transitional,
    Fluid.of(fluid, amount)
  ])
}

var deployStep = function(transitional, input) {
  return auto.recipes.createDeploying(transitional, [
    transitional,
    input
  ])
}

var assembly = function(output, input, sequence, loops) {
  auto.recipes.createSequencedAssembly(
    [CreateItem.of(output, 1.0)],
    input,
    sequence
  )
    .transitionalItem(input)
    .loops(loops || 1)
}

  // --------------------------------------------------
  // MELTING YIELDS
  // --------------------------------------------------

  var MELTING_YIELDS = {
    Ingot: 90,
    Plate: 90,
    DoublePlate: 180,
    Rod: 45,
    LongRod: 90,
    Nugget: 10,
    Bolt: 11,
    Screw: 11,
    Foil: 22,
    Wire: 11,
    Spool: 90,
    Gear: 360,
    SmallGear: 180,
    DensePlate: 720,
    Block: 810,
    Nanoswarm: 176
  }

  var MELTING_FORMS = [
    'Ingot',
    'Plate',
    'DoublePlate',
    'Rod',
    'LongRod',
    'Nugget',
    'Bolt',
    'Screw',
    'Foil',
    'Wire',
    'Spool',
    'Gear',
    'SmallGear',
    'DensePlate',
    'Block',
    'Nanoswarm'
  ]

  // --------------------------------------------------
  // MATERIAL GENERATION
  // --------------------------------------------------

  for (var mat of global.MATERIALS) {
    var id = mat.id

    var ingot = item(mat, 'Ingot')
    var plate = item(mat, 'Plate')
    var rod = item(mat, 'Rod')
    var longRod = item(mat, 'LongRod')
    var doublePlate = item(mat, 'DoublePlate')
    var densePlate = item(mat, 'DensePlate')
    var foil = item(mat, 'Foil')
    var bolt = item(mat, 'Bolt')
    var screw = item(mat, 'Screw')
    var wire = item(mat, 'Wire')
    var spool = item(mat, 'Spool')
    var gear = item(mat, 'Gear')
    var smallGear = item(mat, 'SmallGear')
    var nugget = item(mat, 'Nugget')
    var block = item(mat, 'Block')
    var nanoswarm = item(mat, 'Nanoswarm')
    var dust = item(mat, 'Dust')

    var early = isEarly(mat)

    if (has(mat, 'Ingot')) {
      auto.remove({
        type: 'minecraft:smelting',
        output: '#c:ingots/' + id
      })
      auto.remove({
        mod: 'moremekanismprocessing',
        output: /^(?!.*dirty).*:.*_dust$/
    })
      // Dust -> Ingot via smelting
    }
    if (has(mat, 'Ingot') && has(mat, 'Dust')) {auto.smelting(ingot, '#c:dusts/' + id)}

    // ------------------------------------------------
    // BLOCK AND NUGGET CONVERSIONS
    // ------------------------------------------------

    if (!isGem(mat) && has(mat, 'Ingot')) {
      if (has(mat, 'Block')) {
        // Remove existing conversion recipes.
        auto.remove({
          input: block,
          output: ingot
        })

        auto.remove({
          input: ingot,
          output: block
        })

        auto.remove({
          input: nugget,
          output: ingot
        })

        auto.remove({
          input: ingot,
          output: nugget
        })

        // 9 Ingots -> Block.
        auto.shaped(block, [
          'III',
          'III',
          'III'
        ], {
          I: ingot
        })

        // Block -> 9 Ingots.
        auto.shapeless(
          Item.of(ingot, 9),
          [block]
        )
      }

      if (has(mat, 'Nugget')) {
        auto.remove({
          input: nugget,
          output: ingot
        })

        auto.remove({
          input: ingot,
          output: nugget
        })

        // 9 Nuggets -> Ingot.
        auto.shaped(ingot, [
          'NNN',
          'NNN',
          'NNN'
        ], {
          N: nugget
        })

        // Ingot -> 9 Nuggets.
        auto.shapeless(
          Item.of(nugget, 9),
          [ingot]
        )
      }
    }

    // ------------------------------------------------
    // WIRE SPOOL
    // ------------------------------------------------

    if (has(mat, 'Spool') && has(mat, 'Wire')) {
      auto.shaped(spool, [
        'WWW',
        'WSW',
        'WWW'
      ], {
        W: wire,
        S: 'minecraft:stick'
      })
    }

    // ------------------------------------------------
    // CREATE: EARLY-GAME PROCESSING
    // ------------------------------------------------

    if (early) {
      // Mechanical Press: Ingot -> Plate.
      if (has(mat, 'Ingot') && has(mat, 'Plate')) {
        auto.recipes.createPressing(plate, ingot)
      }

      // Mechanical Saw: Ingot -> 2 Rod.
      if (has(mat, 'Ingot') && has(mat, 'Rod')) {
        auto.recipes.createCutting(
          '2x ' + rod,
          ingot
        )
      }

      // Mechanical Saw: Plate -> 3 Foil.
      if (has(mat, 'Plate') && has(mat, 'Foil')) {
        auto.recipes.createCutting(
          '3x ' + foil,
          plate
        )
      }

      // Mechanical Saw: Rod -> 3 Bolts.
      if (has(mat, 'Rod') && has(mat, 'Bolt')) {
        auto.recipes.createCutting(
          '3x ' + bolt,
          rod
        )
      }

      // Sandpaper: Bolt -> Screw.
      if (has(mat, 'Bolt') && has(mat, 'Screw')) {
        auto.recipes.createSandpaperPolishing(
          screw,
          bolt
        )
      }

      // Mechanical Saw: Ingot -> 6 Wire.
      if (has(mat, 'Ingot') && has(mat, 'Wire')) {
        auto.recipes.createCutting(
          '6x ' + wire,
          ingot
        )
      }
    }
    // ============================================================
// CREATE SEQUENCED ASSEMBLY
// ============================================================

// Double Plate
      if (has(mat, 'Plate') && has(mat, 'DoublePlate')) {
        assembly(doublePlate, plate, [
          fillStep(plate, 'minecraft:lava', 50),
          deployStep(plate, plate),
          fillStep(plate, 'minecraft:water', 50)
        ])
      }

      // Long Rod
      if (has(mat, 'Rod') && has(mat, 'LongRod')) {
        assembly(longRod, rod, [
          fillStep(rod, 'minecraft:lava', 50),
          deployStep(rod, rod),
          fillStep(rod, 'minecraft:water', 50)
        ])
      }

      // Gear
      if (
        has(mat, 'Bolt') &&
        has(mat, 'Rod') &&
        has(mat, 'Plate') &&
        has(mat, 'Gear')
      ) {
        assembly(gear, bolt, [
          fillStep(bolt, 'minecraft:lava', 50),
          deployStep(bolt, rod),
          deployStep(bolt, plate),
          fillStep(bolt, 'minecraft:water', 50)
        ], 6)
      }

      // Small Gear
      if (
        has(mat, 'LongRod') &&
        has(mat, 'Plate') &&
        has(mat, 'Bolt') &&
        has(mat, 'SmallGear')
      ) {
        assembly(smallGear, longRod, [
          deployStep(longRod, plate),
          deployStep(longRod, bolt)
        ], 3)
      }

      if (EARLY_MATERIALS.includes(mat.id)) {
        if (has(mat, 'Ingot') && has(mat, 'Plate')) {
          auto.recipes.createdieselgenerators.hammering(plate, ingot)
        }

        if (has(mat, 'Plate') && has(mat, 'Foil')) {
          auto.recipes.createdieselgenerators.wire_cutting(
            [item(mat, 'Foil', 2)],
            plate
          )
        }
      }

      // Remove existing plate recipes
      if (has(mat, 'Plate')) {
        auto.remove({ output: plate })
      }

      // Remove existing gear recipes
      if (has(mat, 'Gear')) {
        auto.remove({ output: gear })
      }

    
  // ============================================================
  // NUCLEARCRAFT: UNIFY
  // ============================================================

   var moltenMap = {}

  // Build the complete mapping first.
  for (var mat of global.MATERIALS) {
    // MOLTEN
    if (mat.molten === true) {
      var oldMoltenId = `nuclearcraft:molten_${mat.id}`
      var newMoltenId = `kubejs:molten_${mat.id}`

      var oldMoltenLoc = $ResourceLocation.tryParse(oldMoltenId)
      var newMoltenLoc = $ResourceLocation.tryParse(newMoltenId)

      if (
        $BuiltInRegistries.FLUID.containsKey(oldMoltenLoc) &&
        $BuiltInRegistries.FLUID.containsKey(newMoltenLoc)
      ) {
        moltenMap[oldMoltenId] = newMoltenId
      }
    }

    // LIQUID
    if (mat.liquid === true) {
      var oldLiquidId = `nuclearcraft:liquid_${mat.id}`
      var newLiquidId = `kubejs:liquid_${mat.id}`

      var oldLiquidLoc = $ResourceLocation.tryParse(oldLiquidId)
      var newLiquidLoc = $ResourceLocation.tryParse(newLiquidId)

      if (
        $BuiltInRegistries.FLUID.containsKey(oldLiquidLoc) &&
        $BuiltInRegistries.FLUID.containsKey(newLiquidLoc)
      ) {
        moltenMap[oldLiquidId] = newLiquidId
      }
    }
  }

var replacedRecipes = 0
var replacedFluids = 0
var replacedItems = 0

auto.forEachRecipe({ mod: 'nuclearcraft' }, recipe => {
  var json = recipe.json.deepCopy()
  var changed = false

  // FLUID INPUTS AND OUTPUTS
  for (var key of ['fluid_inputs', 'fluid_outputs']) {
    var fluids = json.getAsJsonArray(key)
    if (!fluids) continue

    for (var entry of fluids) {
      var fluid = entry.getAsJsonObject()

      // Explicit fluid IDs (molten + liquid both live in moltenMap now)
      if (fluid.has('fluid')) {
        var oldFluidId = fluid.get('fluid').getAsString()
        var newFluidId = moltenMap[oldFluidId]

        if (newFluidId) {
          fluid.addProperty('fluid', newFluidId)
          changed = true
          replacedFluids++
        }
      }

      // Material fluid tags
      else if (fluid.has('tag')) {
        var oldTag = fluid.get('tag').getAsString()

        for (var mat of global.MATERIALS) {
          if (mat.molten === true && oldTag === `c:molten_${mat.id}`) {
            fluid.remove('tag')
            fluid.addProperty('fluid', `kubejs:molten_${mat.id}`)
            changed = true
            replacedFluids++
            break
          }

          if (mat.liquid === true && oldTag === `c:liquid_${mat.id}`) {
            fluid.remove('tag')
            fluid.addProperty('fluid', `kubejs:liquid_${mat.id}`)
            changed = true
            replacedFluids++
            break
          }
        }
      }
    }
  }

  // ITEM INPUTS AND OUTPUTS
  for (var key of ['item_inputs', 'item_outputs']) {
    var items = json.getAsJsonArray(key)
    if (!items) continue

    for (var entry of items) {
      var item = entry.getAsJsonObject()
      if (!item.has('tag')) continue

      var oldTag = item.get('tag').getAsString()
      var newItemId = null

      for (var mat of global.MATERIALS) {
        var ingotTag = `c:ingots/${mat.id}`
        var dustTag = `c:dusts/${mat.id}`

        // Outputs are always ingots
        if (oldTag === ingotTag) {
          newItemId = `kubejs:${mat.id}_ingot`
          break
        }

        if (oldTag === dustTag) {
          newItemId = `kubejs:${mat.id}_dust`
          break
        }

        // Inputs can be ingots or dusts
        if (key === 'item_inputs' && oldTag === dustTag) {
          newItemId = `kubejs:${mat.id}_dust`
          break
        }
      }

      if (newItemId) {
        item.remove('tag')
        item.addProperty('item', newItemId)
        changed = true
        replacedItems++
      }
    }
  }

  if (changed) {
  recipe.json = json
  replacedRecipes++
}
})

if (Item.exists(`nuclearcraft:${mat.id}_ingot`)) {
  auto.remove([
    {type: 'minecraft:smelting', output: `nuclearcraft:${mat.id}_ingot`},
    {type: 'minecraft:blasting', output: `nuclearcraft:${mat.id}_ingot`},
    {type: 'minecraft:crafting', output: `nuclearcraft:${mat.id}_ingot`}
  ])
}    // ------------------------------------------------
    // NUCLEARCRAFT: PRESSURIZER
    // ------------------------------------------------

    // Ingot -> Plate.
    if (has(mat, 'Ingot') && has(mat, 'Plate')) {
      ncRecipe(
        'nuclearcraft:pressurizer',
        mat,
        [itemInput(mat, 'Ingot', 1)],
        'Plate',
        1
      )
    }

    // 2 Plates -> Double Plate.
    if (has(mat, 'Plate') && has(mat, 'DoublePlate')) {
      ncRecipe(
        'nuclearcraft:pressurizer',
        mat,
        [itemInput(mat, 'Plate', 2)],
        'DoublePlate',
        1
      )
    }

    // 2 Rods -> Long Rod.
    if (has(mat, 'Rod') && has(mat, 'LongRod')) {
      ncRecipe(
        'nuclearcraft:pressurizer',
        mat,
        [itemInput(mat, 'Rod', 2)],
        'LongRod',
        1
      )
    }

    // Block -> Dense Plate.
    if (has(mat, 'Block') && has(mat, 'DensePlate')) {
      ncRecipe(
        'nuclearcraft:pressurizer',
        mat,
        [itemInput(mat, 'Block', 1)],
        'DensePlate',
        1
      )
    }



    // ------------------------------------------------
    // MEKMM: PRESSER - LONG ROD
    // ------------------------------------------------

    if (
      has(mat, 'Rod') &&
      has(mat, 'Bolt') &&
      has(mat, 'LongRod')
    ) {
      presserRecipe(
        mat,
        'Rod', 1,
        'Bolt', 1,
        'Rod', 1,
        'LongRod'
      )
    }

    // ------------------------------------------------
    // MEKMM: CNC STAMPER
    // ------------------------------------------------

    var mold = 'minecraft:obsidian'

      if (has(mat, 'Ingot') && has(mat, 'Plate')) {
        stamperRecipe(plate, ingot, 1, mold)
      }

      if (has(mat, 'Plate') && has(mat, 'DoublePlate')) {
        stamperRecipe(doublePlate, plate, 2, mold)
      }

      if (has(mat, 'Rod') && has(mat, 'LongRod')) {
        stamperRecipe(longRod, rod, 2, mold)
      }

      if (has(mat, 'Block') && has(mat, 'DensePlate')) {
        stamperRecipe(densePlate, block, 1, mold)
      }

    // ------------------------------------------------
    // MEKMM: CNC LATHE
    // ------------------------------------------------

    // Ingot -> 2 Rods.
    if (has(mat, 'Ingot') && has(mat, 'Rod')) {
      auto.recipes.mekmm.lathe(
        Item.of(rod, 2),
        ingot
      )
    }

    // Bolt -> Screw.
    if (has(mat, 'Bolt') && has(mat, 'Screw')) {
      auto.recipes.mekmm.lathe(
        screw,
        bolt
      )
    }

    // ------------------------------------------------
    // NUCLEARCRAFT: ASSEMBLER
    // ------------------------------------------------

    // Gear: 4 Plates + 4 Rods + 1 Bolt.
    if (
      has(mat, 'Plate') &&
      has(mat, 'Rod') &&
      has(mat, 'Bolt') &&
      has(mat, 'Gear')
    ) {
      ncRecipe(
        'nuclearcraft:assembler',
        mat,
        [
          itemInput(mat, 'Plate', 4),
          itemInput(mat, 'Rod', 4),
          itemInput(mat, 'Bolt', 1)
        ],
        'Gear',
        1
      )

      // MekMM Presser: same three inputs.
      presserRecipe(
        mat,
        'Plate', 4,
        'Rod', 4,
        'Bolt', 1,
        'Gear'
      )
    }

    // Small Gear: 1 Long Rod + 2 Plates + 1 Bolt.
    if (
      has(mat, 'LongRod') &&
      has(mat, 'Plate') &&
      has(mat, 'Bolt') &&
      has(mat, 'SmallGear')
    ) {
      ncRecipe(
        'nuclearcraft:assembler',
        mat,
        [
          itemInput(mat, 'LongRod', 1),
          itemInput(mat, 'Plate', 2),
          itemInput(mat, 'Bolt', 1)
        ],
        'SmallGear',
        1
      )

      // MekMM Presser: same three inputs.
      presserRecipe(
        mat,
        'LongRod', 1,
        'Plate', 2,
        'Bolt', 1,
        'SmallGear'
      )
    }

    // ------------------------------------------------
    // NANOSWARM: NUCLEARCRAFT ASSEMBLER
    // ------------------------------------------------

    if (has(mat, 'Bolt') && has(mat, 'Nanoswarm')) {
      var stats = processing(mat)

      // 16 Bolts + 4 NuclearCraft Basic Circuits.
      auto.custom({
        type: 'nuclearcraft:assembler',
        energy_per_tick: stats.energy_per_tick,
        process_time: stats.process_time,
        item_inputs: [
          itemInput(mat, 'Bolt', 16),
          {
            count: 4,
            item: 'nuclearcraft:basic_electric_circuit'
          }
        ],
        item_outputs: [
          itemOutput(mat, 'Nanoswarm', 1)
        ]
      })

      // 16 Bolts + 1 Mekanism Advanced Control Circuit.
      auto.custom({
        type: 'nuclearcraft:assembler',
        energy_per_tick: stats.energy_per_tick,
        process_time: stats.process_time,
        item_inputs: [
          itemInput(mat, 'Bolt', 16),
          {
            count: 1,
            item: 'mekanism:advanced_control_circuit'
          }
        ],
        item_outputs: [
          itemOutput(mat, 'Nanoswarm', 1)
        ]
      })
    }

    // ------------------------------------------------
    // MEKANISM: SAWMILL
    // ------------------------------------------------

    // Plate -> 4 Foil.
    if (has(mat, 'Plate') && has(mat, 'Foil')) {
      auto.recipes.mekanismSawing(
        '4x ' + foil,
        plate
      )
    }

    // Rod -> 4 Bolts.
    if (has(mat, 'Rod') && has(mat, 'Bolt')) {
      auto.recipes.mekanismSawing(
        '4x ' + bolt,
        rod
      )
    }

    // Ingot -> 8 Wire.
    if (has(mat, 'Ingot') && has(mat, 'Wire')) {
      auto.recipes.mekanismSawing(
        '8x ' + wire,
        ingot
      )
    }

    // ------------------------------------------------
    // MEKANISM: CRUSHER RECYCLING
    // ------------------------------------------------
    var crush = function(input, inputCount, outputCount) {
      auto.recipes.mekanismCrushing(
        Item.of(dust, outputCount),
        Item.of(input, inputCount)
      )
    }
    if(!has(mat, 'noDust')) {

          if (has(mat, 'Ingot')) {
      crush(ingot, 1, 1)
    }

    if (has(mat, 'Plate')) {
      crush(plate, 1, 1)
    }

    if (has(mat, 'LongRod')) {
      crush(longRod, 1, 1)
    }

    if (has(mat, 'Rod')) {
      crush(rod, 2, 1)
    }

    if (has(mat, 'DoublePlate')) {
      crush(doublePlate, 1, 2)
    }

    if (has(mat, 'Nugget')) {
      crush(nugget, 9, 1)
    }

    if (has(mat, 'Bolt')) {
      crush(bolt, 8, 1)
    }

    if (has(mat, 'Screw')) {
      crush(screw, 8, 1)
    }

    if (has(mat, 'Foil')) {
      crush(foil, 4, 1)
    }

    if (has(mat, 'SmallGear')) {
      crush(smallGear, 1, 2)
    }

    if (has(mat, 'Gear')) {
      crush(gear, 1, 4)
    }

    if (has(mat, 'DensePlate')) {
      crush(densePlate, 1, 8)
    }

    if (has(mat, 'Block')) {
      crush(block, 1, 9)
    }

    if (has(mat, 'Nanoswarm')) {
      crush(nanoswarm, 1, 2)
    }
    }


// ------------------------------------------------
// NUCLEARCRAFT: MELTER
// ------------------------------------------------

if (mat.molten === true) {

  var oldFluidId = `nuclearcraft:molten_${mat.id}`
  var newFluidId = `kubejs:molten_${mat.id}`

var oldFluidLocation = $ResourceLocation.tryParse(oldFluidId)

if ($BuiltInRegistries.FLUID.containsKey(oldFluidLocation)) {
  var replaced = 0

  auto.forEachRecipe({ mod: 'nuclearcraft' }, recipe => {
    var json = recipe.json.deepCopy()
    var changed = false

    for (var key of ['fluid_inputs', 'fluid_outputs']) {
      var fluids = json.getAsJsonArray(key)
      if (!fluids) continue

      for (var entry of fluids) {
        var fluid = entry.getAsJsonObject()

        if (!fluid.has('fluid')) continue

        if (fluid.get('fluid').getAsString() === oldFluidId) {
          fluid.addProperty('fluid', newFluidId)
          changed = true
        }
      }
    }

    if (changed) {
      auto.custom(json).id(recipe.getId())
      replaced++
    }
  })

}

  var stats = processing(mat)

  var meltingItems = [
    ['Ingot',       ingot      ],
    ['Plate',       plate      ],
    ['DoublePlate', doublePlate],
    ['Rod',         rod        ],
    ['LongRod',     longRod    ],
    ['Nugget',      nugget     ],
    ['Bolt',        bolt       ],
    ['Screw',       screw      ],
    ['Foil',        foil       ],
    ['Wire',        wire       ],
    ['Spool',       spool      ],
    ['Gear',        gear       ],
    ['SmallGear',   smallGear  ],
    ['DensePlate',  densePlate ],
    ['Block',       block      ],
    ['Nanoswarm',   nanoswarm  ]

  ]

  for (var entry of meltingItems) {
    var flag = entry[0]
    var input = entry[1]
    var yieldAmount = MELTING_YIELDS[flag]

    if (has(mat, flag) && yieldAmount) {
      auto.custom({
        type: 'nuclearcraft:melter',
        energy_per_tick: stats.energy_per_tick,
        process_time: stats.process_time,
        item_inputs: [{ count: 1, item: input }],
        fluid_outputs: [{ amount: yieldAmount, fluid: 'kubejs:molten_' + mat.id }]
      })
    }
  }

  // Dust
  if(!has(mat, 'noDust')) {
    auto.custom({
    type: 'nuclearcraft:melter',
    energy_per_tick: stats.energy_per_tick,
    process_time: stats.process_time,
    item_inputs: [{ count: 1, item: dust }],
    fluid_outputs: [{ amount: 90, fluid: 'kubejs:molten_' + mat.id }]
  })
  }
  

  // ============================================================
// INGOT FORMER
// ============================================================

auto.custom({
  'neoforge:conditions': [{
      type: 'neoforge:not',
      value: {
        type: 'neoforge:tag_empty',
        tag: 'c:ingots/' + mat.id
      }}],
  type: 'nuclearcraft:ingot_former',
  energy_per_tick: stats.energy_per_tick,
  fluid_inputs: [{
      amount: 90,
      fluid: 'kubejs:molten_' + mat.id
    }],
  item_outputs: [{
      item: 'kubejs:' + mat.id + '_ingot'
    }],
  process_time: stats.process_time
})
}


// ============================================================
// INDUSTRIAL FOREGOING — DISSOLUTION CHAMBER
// ============================================================

// Gear: 4 Plates + 10 mB Lubrication Oil
if (has(mat, 'Plate') && has(mat, 'Gear')) {
  auto.recipes.industrialforegoing.dissolution_chamber(
    [
      Item.of(item(mat, 'Plate')),
      Item.of(item(mat, 'Plate')),
      Item.of(item(mat, 'Plate')),
      Item.of(item(mat, 'Plate'))
    ],
    Fluid.of('tfmg:lubrication_oil', 10),
    Item.of(item(mat, 'Gear'), 1),
    200
  )
}

// Small Gear: 1 Plate + 1 Long Rod + 10 mB Lubrication Oil
if (has(mat, 'Plate') && has(mat, 'LongRod') && has(mat, 'SmallGear')) {
  auto.recipes.industrialforegoing.dissolution_chamber(
    [
      Item.of(item(mat, 'Plate'), 1),
      Item.of(item(mat, 'LongRod'), 1)
    ],
    Fluid.of('tfmg:lubrication_oil', 10),
    Item.of(item(mat, 'SmallGear'), 1),
    200
  )
}

// Dense Plate: 8 Ingots + 25 mB Heavy Water
if (has(mat, 'Ingot') && has(mat, 'DensePlate')) {
  auto.recipes.industrialforegoing.dissolution_chamber(
    [
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot')),
      Item.of(item(mat, 'Ingot'))
    ],
    Fluid.of('mekanism:heavy_water', 25),
    Item.of(item(mat, 'DensePlate'), 1),
    200
  )
}

  if (Item.exists(`moremekanismprocessing:dirty_dust_${mat.id}`)) {
  auto.remove({ id: `moremekanismprocessing:processing/${mat.id}/dust/from_dirty_dust` })
  auto.recipes.mekanism.enriching(`kubejs:${mat.id}_dust`, `moremekanismprocessing:dirty_dust_${mat.id}`)
}
  }
//----------------------------------------------------------
// TFMG
//----------------------------------------------------------
auto.forEachRecipe({ mod: 'tfmg' }, recipe => {
  var json = recipe.json.deepCopy()
  var changed = false

  // INGREDIENTS
  var ingredients = json.getAsJsonArray('ingredients')
  if (ingredients) {
    for (var entry of ingredients) {
      var obj = entry.getAsJsonObject()

      // fluid tag: c:molten_X
      if (obj.has('tag')) {
        var tag = obj.get('tag').getAsString()
        for (var mat of global.MATERIALS) {
          if (mat.molten === true && tag === `c:molten_${mat.id}`) {
            obj.remove('tag')
            obj.addProperty('type', 'neoforge:single')
            obj.addProperty('fluid', `kubejs:molten_${mat.id}`)
            changed = true
            break
          }
        }
      }

      // explicit fluid id: tfmg:molten_X + silicon exception
      if (obj.has('fluid')) {
        var fluidId = obj.get('fluid').getAsString()

        if (fluidId === 'tfmg:liquid_silicon') {
          obj.addProperty('fluid', 'kubejs:molten_silicon')
          changed = true
        } else {
          for (var mat of global.MATERIALS) {
            if (mat.molten === true && fluidId === `tfmg:molten_${mat.id}`) {
              obj.addProperty('fluid', `kubejs:molten_${mat.id}`)
              changed = true
              break
            }
          }
        }
      }
    }
  }

  // RESULTS
  var results = json.getAsJsonArray('results')
  if (results) {
    for (var entry of results) {
      var obj = entry.getAsJsonObject()
      if (!obj.has('id')) continue

      var id = obj.get('id').getAsString()

      // silicon exception
      if (id === 'tfmg:liquid_silicon') {
        obj.addProperty('id', 'kubejs:molten_silicon')
        changed = true
        continue
      }

      for (var mat of global.MATERIALS) {
        // tfmg:molten_X → kubejs:molten_X
        if (mat.molten === true && id === `tfmg:molten_${mat.id}`) {
          obj.addProperty('id', `kubejs:molten_${mat.id}`)
          changed = true
          break
        }

        // tfmg:X_ingot → kubejs:X_ingot
        if (id === `tfmg:${mat.id}_ingot`) {
          obj.addProperty('id', `kubejs:${mat.id}_ingot`)
          changed = true
          break
        }

        // tfmg:X_nugget → kubejs:X_nugget
        if (id === `tfmg:${mat.id}_nugget`) {
          obj.addProperty('id', `kubejs:${mat.id}_nugget`)
          changed = true
          break
        }
      }
    }
  }

  if (changed) {
    recipe.json = json
  }

  for (var mat of global.MATERIALS) {
  auto.remove({ id: `mekanism:processing/${mat.id}/dust/from_ingot` })
  auto.remove({ id: `moremekanismprocessing:processing/${mat.id}/ingot/from_nugget` })
  auto.remove({ id: `moremekanismprocessing:processing/${mat.id}/nugget/from_ingot` })
  auto.remove({ id: `nuclearcraft:melter/${mat.id}_ingot` })
  auto.remove({ id: `nuclearcraft:melter/${mat.id}_dust` })
  auto.remove({ id: `nuclearcraft:ingot_former/${mat.id}` })
  auto.remove({ id: `nuclearcraft:${mat.id}_ingot_from_nugget` })

}


})


})

ServerEvents.tags('item', event => {
  for (var mat of global.MATERIALS) {

    // nuclearcraft
    for (var suffix of ['ingot', 'dust', 'plate']) {
      event.removeAllTagsFrom(`nuclearcraft:${mat.id}_${suffix}`)
    }

    // tfmg
    for (var suffix of ['ingot', 'nugget']) {
      event.removeAllTagsFrom(`tfmg:${mat.id}_${suffix}`)
    }

    // moremekanismprocessing
    event.removeAllTagsFrom(`moremekanismprocessing:${mat.id}_ingot`)
    event.removeAllTagsFrom(`moremekanismprocessing:dust_${mat.id}`)

    if (mat.form === 'gem') {
      event.removeAllTagsFrom(`moremekanismprocessing:gem_${mat.id}`)
    }
  }
})