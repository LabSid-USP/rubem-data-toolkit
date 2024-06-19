/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-47.01707809665109, -23.73545666228563],
          [-47.12144821383859, -24.427530727253686],
          [-46.24803512790109, -24.03681729651776],
          [-46.35789840915109, -23.65497556446401]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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
datePanel.add(ui.Textbox({
    'placeholder': 'yyyy-mm-dd'
  }));
datePanel.add(ui.Label('Digite a data final:'));
datePanel.add(ui.Textbox({
    'placeholder': 'yyyy-mm-dd'
  }));


collectionPanel.add(ui.Label('Selecione a coleção:'));
collectionPanel.add(ui.Select({items: ['UCSB-CHG/CHIRPS/PENTAD']}));

// Adicionar painéis à interface do usuário
panelMain.add(geometryPanel);
panelMain.add(datePanel);
panelMain.add(collectionPanel);

// center map
Map.centerObject(geometry, 5)

// add Geometry to map
Map.addLayer(geometry, {}, 'Geometry')

// Wind visualization
var palette = palettesGeneral.colorbrewer.Blues[7];
var windVis = {
  min: 0.0,
  max: 500.0,
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
  
  
  // collection of images
  var dataset = ee.ImageCollection(collectionName)
    .filter(ee.Filter.date(startDate, endDate));
  
  // Scaled range up to 1
  var precp = dataset.select('total_precipitation');
  
  // scaledNDVI = windS

  
  var precP = precp.map(function(image){
    return image.multiply(0.03042)
    .copyProperties(image,['system:time_start','system:time_end']);
  });
  
  
  var triplets = precp.map(function(image) {
    var withStats = image.reduceRegions({
    collection: geometry,
    reducer: ee.Reducer.mean().setOutputs(['Precipitation']),
    scale: 250
    }).map(function(feature) {
      return feature.set('imageId', image.id())
    })
    return withStats
  }).flatten()
  
  // define mean monthly precipitation 
  var monthMean = ee.List.sequence(0, diff).map(function(n) {
    var start = ee.Date(startDate).advance(n, 'month');
    var end = start.advance(1, 'month');
    return ee.ImageCollection(precP)
          .filterDate(start, end)
          .max()
          .set('system:time_start', start.millis());
  });
  
  // create image collection from monthly avg
  var collection = ee.ImageCollection(monthMean);
  
  // clip images to the polygon boundary
  var clippedPrecp = collection.map(function(image) {
      return ee.Image(image).clip(geometry)
    })
  
  // Plotting chart of monthly Rainfall
  var title = 'Monthly Precipitation of Geometry';
  
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
  batch.Download.ImageCollection.toDrive(clippedPrecp, 'Precipitation', 
    {
      region: clippedPrecp,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 250,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first NDVI image to map
  Map.addLayer(clippedPrecp, windVis, 'Precipitation');
  
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
      min: 0, max: 500,
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
  var colorBar = createColorBar('Precipitation - First Image ', palette, 0, 500)
  
  Map.add(colorBar)
};

// Adicionar um botão para iniciar o download
panelMain.add(ui.Button('Iniciar download', downloadTasks));

ui.root.add(panelMain);
