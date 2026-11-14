ServerEvents.tags('item', event => {
event.add('accessories:hat', 'kubejs:darrel')
})
PlayerEvents.tick(event => {
    const player = event.player
    if (player.tickCount % 60 !== 0) return
    
    const AccessoriesCapability = Java.loadClass('io.wispforest.accessories.api.AccessoriesCapability')
    const capability = AccessoriesCapability.get(player)
    if (capability == null) return
    
    const hasdarrel = capability.isEquipped(Item.of('kubejs:darrel').item)
    if (hasdarrel) {
        player.potionEffects.add('minecraft:resistance', 80, 5, true, false)
        player.potionEffects.add('minecraft:luck', 80, 254, true, false)
    }
})