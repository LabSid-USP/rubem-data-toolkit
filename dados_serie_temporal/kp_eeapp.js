/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-43.7642366551437, -21.487769028819383],
          [-43.7642366551437, -22.04892569968417],
          [-42.6216585301437, -22.04892569968417],
          [-42.6216585301437, -21.487769028819383]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
///https://earthscience.stackexchange.com/questions/2360/how-do-i-convert-specific-humidity-to-relative-humidity/2361#2361

var batch = require('users/fitoprincipe/geetools:batch')
var palettesGeneral = require('users/gena/packages:palettes');

// Criar painéis para entrada de dados/
var panelMain = ui.Panel({
  'layout': ui.Panel.Layout.flow('vertical'),
  'style': {
      'width': '360px',
      'position': 'bottom-left',
      'margin': '0px 0px 0px 0px',
  },
});

var geometryPanel = ui.Panel();
var datePanel = ui.Panel();

// Adicionar widgets para entrada de dados
geometryPanel.add(ui.Label('Desenhe o polígono desejado na área do mapa e nomeie a camada como `geometry`.'));
datePanel.add(ui.Label('Digite a data inicial:'));
datePanel.add(ui.Textbox({
    'placeholder': 'yyyy-mm-dd'
  }));
datePanel.add(ui.Label('Digite a data final:'));
datePanel.add(ui.Textbox({
    'placeholder': 'yyyy-mm-dd'
  }));

// Adicionar painéis à interface do usuário
panelMain.add(geometryPanel);
panelMain.add(datePanel);

// center map
Map.centerObject(geometry, 5)

// add Geometry to map
Map.addLayer(geometry, {}, 'Geometry')

// Relative Humidity visualization
var palette = palettesGeneral.colorbrewer.Blues[5];
var hrVis = {
  min: 0.0,
  max: 100.0,
  palette: palette,
};

// Definir a função de download
var downloadTasks = function() {
  Map.clear()
  // Obter os valores de entrada
  var startDate = ee.Date(datePanel.widgets().get(1).getValue());
  var endDate = ee.Date(datePanel.widgets().get(3).getValue());
  
  // Selecionar o conjunto de dados
  // define the numbers of months between start and end date
  var diff = endDate.difference(startDate, 'month');
  
  
  // RELATIVE HUMIDITY COLLECTION
  // collection of images
  var datasetRH = ee.ImageCollection('NASA/FLDAS/NOAH01/C/GL/M/V001')
    .filter(ee.Filter.date(startDate, endDate));
  
  var collectionRH = datasetRH.map(function(image){
    return ee.Image().expression(
      '0.263 * p * q * (exp(17.67 * (T - T0) / (T - 29.65))) ** -1', {
      T: image.select('Tair_f_tavg'),
      T0: 273.16,
      p: image.select('Psurf_f_tavg'),
      q: image.select('Qair_f_tavg')
    }).float().clip(geometry).rename('humidityR');
  });

  // WIND COLLECTION
  var datasetWD = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_BY_HOUR')
    .filter(ee.Filter.date(startDate, endDate));
  
  // Scaled range up to 1
  var wind = datasetWD.select('u_component_of_wind_10m','v_component_of_wind_10m');
  
  // wind vector
  var windS = wind.map(function(image){
     var wind_10m = image.expression(
    'sqrt(u**2 + v**2)', {
      'u': image.select('u_component_of_wind_10m'),
      'v': image.select('v_component_of_wind_10m'),
  }).rename('windspeed');
  var time = image.get('system:time_start');
  return wind_10m.set('system:time_start', time) } );
  
  // define mean monthly windspeed 
  var monthMean = ee.List.sequence(0, diff).map(function(n) {
    var start = ee.Date(startDate).advance(n, 'month');
    var end = start.advance(1, 'month');
    return ee.ImageCollection(windS)
          .filterDate(start, end)
          .mean()
          .set('system:time_start', start.millis());
  });
  
  // create image collection from monthly avg
  var collection = ee.ImageCollection(monthMean);
  
  // clip images to the polygon boundary
  var clippedWind = collection.map(function(image) {
      return ee.Image(image).clip(geometry)
    })


var filter = ee.Filter.equals({
  leftField: 'system:time_start',
  rightField: 'system:time_start'
});

// Create the join.
var simpleJoin = ee.Join.inner();

// Inner join
var innerJoin = ee.ImageCollection(simpleJoin.apply(clippedWind, collectionRH, filter));

var joined = innerJoin.map(function(feature) {
  return ee.Image.cat(feature.get('primary'), feature.get('secondary'));
});


//KP computation
  var collectionKP = innerJoin.map(function(image){
    return ee.Image().expression(
      '0.482 + 0.024*log(20) - 0.000376*V + 0.0045*RH', {
      V: image.select('windspeed'),
      RH: image.select('humidityRH')
    }).float().rename('kp');
  });

print(collectionKP)
  // Plotting chart of monthly Relative Humidity
  var title = 'Monthly KP';
  
 
  // Download images for a set region
  batch.Download.ImageCollection.toDrive(collectionKP, 'Relative Humidity', 
    {
      region: geometry,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 500,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first NDVI image to map
  Map.addLayer(collectionKP, hrVis, 'Relative Humidity');
  
  // Add bar Legend
  function createColorBar(titleText, palette, min, max) {
  // Legend Title
  var title = ui.Label({
    value: titleText, 
    style: {
      fontWeight: 'bold', 
      textAlign: 'center', 
      stretch: 'horizontal'
    }
  });
  
  // Colorbar
  var legend = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '200x20',
      format: 'png', 
      min: 0, max: 100,
      palette: palette
    },
    style: {stretch: 'horizontal', margin: '8px 8px', maxHeight: '40px'},
  });
    
  // Legend Labels
  var labels = ui.Panel({
    widgets: [
      ui.Label(min, {margin: '4px 10px',textAlign: 'left', stretch: 'horizontal'}),
      ui.Label((min+max)/2, {margin: '4px 20px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(max, {margin: '4px 10px',textAlign: 'right', stretch: 'horizontal'})],
    layout: ui.Panel.Layout.flow('horizontal')});
    
  // Create a panel with all 3 widgets
  var legendPanel = ui.Panel({
    widgets: [title, legend, labels],
    style: {position: 'bottom-center', padding: '8px 15px'}
  })
  return legendPanel
  }
  
  
  // Call the function to create a colorbar legend  
  var colorBar = createColorBar('Relative Humidity - First Image ', palette, 0, 100)
  
  Map.add(colorBar)
};

// Adicionar um botão para iniciar o download
panelMain.add(ui.Button('Iniciar download', downloadTasks));

ui.root.add(panelMain);
