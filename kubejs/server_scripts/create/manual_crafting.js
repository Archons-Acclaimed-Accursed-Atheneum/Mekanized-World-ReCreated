ServerEvents.recipes(create => {
;['andesite', 'diorite', 'granite'].forEach(igneous => {
create.recipes.createdieselgenerators.hammering(`kubejs:${igneous}_dust`, igneous)
create.recipes.createMilling([`2x kubejs:${igneous}_dust`, CreateItem.of(`kubejs:${igneous}_dust`, 0.5)], igneous)
create.recipes.createCrushing(`4x kubejs:${igneous}_dust`, igneous)
})
create.recipes.shapeless('2x kubejs:igneous_alloy_dust', [
'kubejs:andesite_dust',
'kubejs:diorite_dust',
'kubejs:granite_dust'
])
create.custom(
{
  "type": "extradelight:mixing_bowl",
  "fluids": [
    {
      "amount": 25,
      "fluid": "minecraft:lava"
    }
  ],
  "ingredients": [
    {
      "item": "kubejs:andesite_dust"
    },
    {
      "item": "kubejs:diorite_dust"
    },
    {
      "item": "kubejs:granite_dust"
    }
  ],
  "result": {
    "count": 3,
    "id": "kubejs:igneous_alloy_dust"
  },
  "stirs": 6,
  "utensil": {
    "tag": "c:spoons"
  }
}
)

create.shaped('createdieselgenerators:hammer', [
' II',
' SI',
'S  '
], {
I: 'kubejs:iron_ingot',
S: '#c:rods/wooden'
}).id('createdieselgenerators:crafting/hammer')
})