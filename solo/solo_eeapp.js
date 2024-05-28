// centralizar e adicionar o mapa na área de interesse 
Map.centerObject(geometry);
Map.addLayer(geometry, {color: 'FF0000'}, 'Geometry');

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
  var propertiesPanel = ui.Panel();
  
  // Adicionar widgets para entrada de dados
  geometryPanel.add(ui.Label('RUBEM TOOLKIT: SOLO'));
  
  // geometryPanel.add(ui.Label('Portugues: Desenhe ou insira uma área da aba assets e renomei a variavel `table´ para `geometry´'));
  
  // geometryPanel.add(ui.Label('English: Draw or insert your asset of the area named as `geometry´'));
   
  propertiesPanel.add(ui.Label('Selecione a propriedade:'));
  propertiesPanel.add(ui.Select({items: ['COPERNICUS/DEM/GLO30']}));
  
  // Adicionar painéis à interface do usuário
  panelMain.add(geometryPanel);
  panelMain.add(propertiesPanel);
  
  // Definir a função de download
  var downloadTasks = function() {
    // Obter os valores de entrada
    // var collectionName = propertiesPanel.widgets().get(1).getValue();    

    // var dataset = ee.ImageCollection(collectionName);
    // var filtered = dataset.filter(ee.Filter.bounds(geometry)).select('DEM');
    // var image = filtered.reduce(ee.Reducer.max());
    // var clipped = image.clip(geometry);
    
    // Definir as opções de exportação
    var exportOptions = {
      image: clipped,
      description: 'DEM',
      region: geometry,
      folder: 'RUBEM_DATA_TOOLKIT',
      fileFormat: 'GeoTIFF',
      fileNamePrefix: 'demFile',
      scale: 30,
      maxPixels: 2e10
    };

    // Criar a tarefa de exportação
    Export.image.toDrive(exportOptions);
  };
  
  // Adicionar um botão para iniciar o download
  panelMain.add(ui.Button('Iniciar download', downloadTasks));
  
  ui.root.add(panelMain);
  