StartupEvents.registry('fluid', event => {
  for (var mat of global.MATERIALS) {
    if (!mat.liquid && !mat.molten) continue;

    var fluidId, fluidStyle, fluidName, tag1, tag2;

    if (mat.liquid) {
      fluidId = 'liquid_' + mat.id;
      fluidStyle = 'thin';
      fluidName = (mat.gaseous ? '' : 'Liquid ') + mat.display;
      tag1 = 'c:liquid_' + mat.id;
      tag2 = mat.gaseous ? 'c:gaseous' : 'c:liquid';
    } else {
      fluidId = 'molten_' + mat.id;
      fluidStyle = 'thick';
      fluidName = 'Molten ' + mat.display;
      tag1 = 'c:molten_' + mat.id;
      tag2 = 'c:molten';
    }

    var temperature = mat.temperature == null ? 303 : mat.temperature;
    var color = mat.color || 0xFFFFFF;
    var isGaseous = mat.gaseous === true;

    event.create(fluidId, fluidStyle)
      //.displayName(fluidName)
      .tint(color)
      .tag(tag1)
      .tag(tag2)
      .type(type => type
        .temperature(temperature)
        .viscosity(isGaseous ? 200 : (fluidStyle === 'thick' ? 6000 : 1000))
        .density(isGaseous ? -100 : (fluidStyle === 'thick' ? 3000 : 1000))
      );

    // Also register bare kubejs:oxygen style fluid for gaseous materials
    if (isGaseous) {
      event.create(mat.id, fluidStyle)
        //.displayName(mat.display)
        .tint(color)
        .tag('c:' + mat.id)
        .tag('c:gaseous')
        .type(type => type
          .temperature(temperature)
          .viscosity(200)
          .density(-100)
        );
    }
  }
})