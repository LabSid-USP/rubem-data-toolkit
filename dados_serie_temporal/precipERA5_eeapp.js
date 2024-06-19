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
collectionPanel.add(ui.Select({items: ['UCSB-CHG/CHIRPS/DAILY']}));

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
  
  // define monthly Rainfall 
  var monthSum = ee.List.sequence(0, diff).map(function(n) {
  var start = startDate.advance(n, 'month');
  var end = start.advance(1, 'month');
  return ee.ImageCollection(collectionName)
        .filterBounds(geometry)
        .filterDate(start, end)
        .sum()
        .set('system:time_start', start.millis());
});

// create image collection from monthly sum
  var dataset = ee.ImageCollection(monthSum).map(function(image) {
      return ee.Image(image).clip(geometry)
    });
  

//Rainy days

var numberOfMonths = endDate.difference(startDate, 'months').floor()
var days_over0Collection = ee.ImageCollection(
  ee.List.sequence(0, numberOfMonths.subtract(1))
    .map(days_over0)
)

function days_over0(monthOffset) {
  var date = startDate.advance(monthOffset, 'months')
  return ee.ImageCollection(collectionName)
    .select('precipitation')
    .filterDate(date, date.advance(1, 'months'))
    .map(function (image) {
      var date1 = image.get('system:time_start')
      var maskzero = image.gt(0); //Here it keeps all pixels greater than 0.
      return image.updateMask(maskzero).set('system:time_start', date1)
    })
    .count()
    .unmask(0)
    .clip(geometry)
    .set('system:time_start', date.millis(), 'dateYMD', date.format('YYYY-MM-dd'))
    ;
    
}

var months = ee.List.sequence(1, 12);

// Group by month, and then reduce within groups by mean();
// the result is an ImageCollection with one image for each
// month.
var byMonth = ee.ImageCollection.fromImages(
      months.map(function (m) {
        return days_over0Collection.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .select(0).mean()
                    .set('month', m).set('system:time_start', ee.Date.fromYMD(1, m, 1));
}));




// Image Collection to Feature Collection
var monthlyRainfall = ee.FeatureCollection(byMonth.map(function (img){
  
  var value = ee.Image(img).reduceRegion(ee.Reducer.mean(),
                                         geometry,
                                         250)
                            .get('precipitation'); 
  
  var month = ee.Image(img).get("month");

  return ee.Feature(null).set('precipitation', value).set('month', month)
                         
  
}));

Export.table.toDrive({
   collection: monthlyRainfall,
   selectors: ['month','precipitation'],
   fileNamePrefix: 'rainy_days',
   fileFormat: 'CSV'});

  
  // Download images for a set region
  batch.Download.ImageCollection.toDrive(dataset, 'Precipitation', 
    {
      region: geometry,
      crs: 'EPSG:4326',
      type: 'float',
      description: 'imageToDriveExample',
      scale: 250,
      fileFormat: 'GeoTIFF',
      
    }
  );
  
  // add the first Precipitation image to map
  Map.addLayer(dataset, windVis, 'Precipitation');
  
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
