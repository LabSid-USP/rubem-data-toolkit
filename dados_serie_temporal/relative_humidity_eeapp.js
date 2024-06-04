/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-43.670852866080914, -21.53403972172142],
          [-43.670852866080914, -21.982996657948593],
          [-42.737014975455914, -21.982996657948593],
          [-42.737014975455914, -21.53403972172142]]], null, false);
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
collectionPanel.add(ui.Select({items: ['NASA/FLDAS/NOAH01/C/GL/M/V001']}));

// Adicionar painéis à interface do usuário
panelMain.add(geometryPanel);
panelMain.add(datePanel);
panelMain.add(collectionPanel);

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
  var collectionName = collectionPanel.widgets().get(1).getValue();
  
  // Selecionar o conjunto de dados
  // define the numbers of months between start and end date
  var diff = endDate.difference(startDate, 'month');
  
  // NDVI
  // collection of images
  var dataset = ee.ImageCollection(collectionName)
    .filter(ee.Filter.date(startDate, endDate));
  
  var collection = dataset.map(function(image){
    return ee.Image().expression(
      '0.263 * p * q * (exp(17.67 * (T - T0) / (T - 29.65))) ** -1', {
      T: image.select('Tair_f_tavg'),
      T0: 273.16,
      p: image.select('Psurf_f_tavg'),
      q: image.select('Qair_f_tavg')
    }).float().clip(geometry);
  });


  // Plotting chart of monthly Relative Humidity
  var title = 'Monthly Relative Humidity of Geometry';
  
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
  batch.Download.ImageCollection.toDrive(collection, 'Relative Humidity', 
    {
      region: collection,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 500,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first NDVI image to map
  Map.addLayer(collection, hrVis, 'Relative Humidity');
  
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
