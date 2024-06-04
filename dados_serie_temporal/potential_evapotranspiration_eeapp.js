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
collectionPanel.add(ui.Select({items: ['IDAHO_EPSCOR/TERRACLIMATE']}));

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
  
  // NDVI
  // collection of images
  var dataset = ee.ImageCollection(collectionName)
    .filter(ee.Filter.date(startDate, endDate));
  
  // Scaled range up to 1
  var pet = dataset.select('pet');
  
  // scaledNDVI = windS

  
  var pet = pet.map(function(image){
    return image.multiply(0.001)
    .copyProperties(image,['system:time_start','system:time_end']);
  });
  
  
  var triplets = pet.map(function(image) {
    var withStats = image.reduceRegions({
    collection: geometry,
    reducer: ee.Reducer.mean().setOutputs(['Potential Evapotranspiration']),
    scale: 250
    }).map(function(feature) {
      return feature.set('imageId', image.id())
    })
    return withStats
  }).flatten()
  
  // define mean monthly Potential Evapotranspiration 
  var monthMean = ee.List.sequence(0, diff).map(function(n) {
    var start = ee.Date(startDate).advance(n, 'month');
    var end = start.advance(1, 'month');
    return ee.ImageCollection(pet)
          .filterDate(start, end)
          .max()
          .set('system:time_start', start.millis());
  });
  
  // create image collection from monthly avg
  var collection = ee.ImageCollection(monthMean);
  
  // clip images to the polygon boundary
  var clippedpet = collection.map(function(image) {
      return ee.Image(image).clip(geometry)
    })
  
  // Plotting chart of monthly Rainfall
  var title = 'Monthly Potential Evapotranspiration of Geometry';
  
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
  batch.Download.ImageCollection.toDrive(clippedpet, 'Potential Evapotranspiration', 
    {
      region: clippedpet,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 250,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first NDVI image to map
  Map.addLayer(clippedpet, windVis, 'Potential Evapotranspiration');
  
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
  var colorBar = createColorBar('Potential Evapotranspiration - First Image ', palette, 0, 500)
  
  Map.add(colorBar)
};

// Adicionar um botão para iniciar o download
panelMain.add(ui.Button('Iniciar download', downloadTasks));

ui.root.add(panelMain);
