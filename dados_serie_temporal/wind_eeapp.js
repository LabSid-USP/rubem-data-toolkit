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
var collectionPanel = ui.Panel();

// Adicionar widgets para entrada de dados
geometryPanel.add(ui.Label('Desenhe o polígono desejado na área do mapa e nomeie a camada como `geometry`.'));
datePanel.add(ui.Label('Digite a data inicial:'));
datePanel.add(ui.Textbox());
datePanel.add(ui.Label('Digite a data final:'));
datePanel.add(ui.Textbox());

collectionPanel.add(ui.Label('Selecione a coleção:'));
collectionPanel.add(ui.Select({items: ['ECMWF/ERA5_LAND/MONTHLY_BY_HOUR']}));

// Adicionar painéis à interface do usuário
panelMain.add(geometryPanel);
panelMain.add(datePanel);
panelMain.add(collectionPanel);

// center map
Map.centerObject(geometry, 5)

// add Geometry to map
Map.addLayer(geometry, {}, 'Geometry')

// Wind visualization
var palette = palettesGeneral.colorbrewer.YlGnBu[5];
var windVis = {
  min: 0.0,
  max: 10.0,
  palette: palette,
};

// Definir a função de download
var downloadTasks = function() {
  // Obter os valores de entrada
  var startDate = ee.Date(datePanel.widgets().get(1).getValue());
  var endDate = ee.Date(datePanel.widgets().get(3).getValue());
  var collectionName = collectionPanel.widgets().get(1).getValue();
  
  // Selecionar o conjunto de dados
  // define the numbers of months between start and end date
  var diff = endDate.difference(startDate, 'month');
  
  // NDVI
  // collection of images
  var dataset = ee.ImageCollection(collectionName)
    .filter(ee.Filter.date(startDate, endDate));
  
  // Scaled range up to 1
  var wind = dataset.select('u_component_of_wind_10m','v_component_of_wind_10m');
  
  // scaledNDVI = windS
  var windS = wind.map(function(image){
     var wind_10m = image.expression(
    'sqrt(u**2 + v**2)', {
      'u': image.select('u_component_of_wind_10m'),
      'v': image.select('v_component_of_wind_10m'),
  }).rename('windspeed');
  var time = image.get('system:time_start');
  return wind_10m.set('system:time_start', time) } );
  
  var triplets = windS.map(function(image) {
    var withStats = image.reduceRegions({
    collection: geometry,
    reducer: ee.Reducer.mean().setOutputs(['windspeed']),
    scale: 250
    }).map(function(feature) {
      return feature.set('imageId', image.id())
    })
    return withStats
  }).flatten()
  
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
  
  // Plotting chart of monthly Rainfall
  var title = 'Mean Monthly Wind Speed of Geometry';
  
  // var timeSeries = ui.Chart.image.seriesByRegion({
  //     imageCollection: clippedWind,
  //     regions: geometry,
  //     reducer: ee.Reducer.mean(),
  //     scale: 250,
  //     xProperty: 'system:time_start',
  //     seriesProperty: 'label'
  //   }).setChartType('ScatterChart')
  //     .setOptions({
  //       title: title,
  //       vAxis: {title: '[NDVI]'},
  //       hAxis: {title: 'Year'},
  //       lineWidth: 1,
  //       pointSize: 1,
  //     });
  
  // print(timeSeries);
    
  // Download images for a set region
  batch.Download.ImageCollection.toDrive(clippedWind, 'WindSpeed', 
    {
      region: clippedWind,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 250,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first NDVI image to map
  Map.addLayer(clippedWind, windVis, 'Wind Speed');
  
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
      min: 0, max: 10,
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
  var colorBar = createColorBar('WindSpeed - First Image ', palette, 0, 10)
  
  Map.add(colorBar)
};

// Adicionar um botão para iniciar o download
panelMain.add(ui.Button('Iniciar download', downloadTasks));

ui.root.add(panelMain);