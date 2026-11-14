RecipeViewerEvents.removeEntries('item', event => {
  for (var mat of global.MATERIALS) {

    // nuclearcraft
    for (var suffix of ['dust', 'plate', 'ingot']) {
      var itemId = `nuclearcraft:${mat.id}_${suffix}`
      if (Item.exists(itemId)) event.remove(itemId)
    }

    var bucketId = `nuclearcraft:molten_${mat.id}_bucket`
    if (Item.exists(bucketId)) event.remove(bucketId)

    // tfmg
    for (var suffix of ['ingot', 'nugget']) {
      var itemId = `tfmg:${mat.id}_${suffix}`
      if (Item.exists(itemId)) event.remove(itemId)
    }

    // moremekanismprocessing
    for (var itemId of [
      `moremekanismprocessing:${mat.id}_ingot`,
      `moremekanismprocessing:dust_${mat.id}`
    ]) {
      if (Item.exists(itemId)) event.remove(itemId)
    }

    if (mat.form === 'gem') {
      var gemId = `moremekanismprocessing:gem_${mat.id}`
      if (Item.exists(gemId)) event.remove(gemId)
    }
  }
})

RecipeViewerEvents.removeEntries('fluid', event => {
  for (var mat of global.MATERIALS) {
    var fluidId = `nuclearcraft:molten_${mat.id}`
    if (Fluid.exists(fluidId)) event.remove(fluidId)
  }
})