// Criar painéis para entrada de dados
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
var shapefilePanel = ui.Panel();

// Adicionar widgets para entrada de dados
geometryPanel.add(ui.Label('Desenhe o polígono desejado na área do mapa e nomeie a camada como `geometry`.'));
datePanel.add(ui.Label('Digite a data inicial:'));
datePanel.add(ui.Textbox());
datePanel.add(ui.Label('Digite a data final:'));
datePanel.add(ui.Textbox());

collectionPanel.add(ui.Label('Selecione a coleção:'));
collectionPanel.add(ui.Select({items: ['MODIS/006/MOD13A1', 'LANDSAT/LC08/C01/T1']}));

// Adicionar painéis à interface do usuário
panelMain.add(geometryPanel);
panelMain.add(datePanel);
panelMain.add(collectionPanel);
panelMain.add(shapefilePanel);

// Definir a função de download
var downloadTasks = function() {
// Obter os valores de entrada
var startDate = datePanel.widgets().get(1).getValue();
var endDate = datePanel.widgets().get(3).getValue();
var collectionName = collectionPanel.widgets().get(1).getValue();
// var shapefilePath = shapefilePanel.widgets().get(1).getValue();

// TODO: Encontrar uma forma de importar um shapefile de geometria 
// https://developers.google.com/earth-engine/guides/table_upload#upload-a-shapefile
// Carregar o shapefile
var aoi = ee.FeatureCollection(shapefilePath);

// Selecionar o conjunto de dados
var dataset = ee.ImageCollection(collectionName).select('NDVI');

// Filtrar o conjunto de dados
var filtered = dataset.filterDate(startDate, endDate).filterBounds(aoi);

// Criar tarefas de download
filtered.map(function(image) {
  // Obter a data da imagem
  var date = image.date().format('yyyy-MM-dd');

  // Definir as opções de exportação
  var exportOptions = {
    image: image,
    description: 'NDVI_' + date,
    scale: 500,
    region: aoi,
    folder: 'NDVI',
    fileFormat: 'GeoTIFF'
  };

  // Criar a tarefa de exportação
  var task = ee.batch.Export.image.toDrive(exportOptions);

  // Iniciar a tarefa
  task.start();
});
};

// Adicionar um botão para iniciar o download
panelMain.add(ui.Button('Iniciar download', downloadTasks));

ui.root.add(panelMain);
