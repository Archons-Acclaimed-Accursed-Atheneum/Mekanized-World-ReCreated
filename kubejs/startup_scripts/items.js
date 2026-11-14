StartupEvents.registry('item', event => {
    event.create('pyrite_chelation_syringe').food(food => food.nutrition(0).saturation(0).alwaysEdible()).tooltip('§8Use this to cure Systemic Toxicity')
    event.create('sodium_hydrosulfide_chelation_syringe').food(food => food.nutrition(0).saturation(0).alwaysEdible()).tooltip('§8Use this to cure Neurotoxicity')

})