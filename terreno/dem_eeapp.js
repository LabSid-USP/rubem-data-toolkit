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
  var collectionPanel = ui.Panel();
  
  // Adicionar widgets para entrada de dados
  geometryPanel.add(ui.Label('Desenhe o polígono desejado na área do mapa e nomeie a camada como `geometry`.'));
  
  collectionPanel.add(ui.Label('Selecione a coleção:'));
  collectionPanel.add(ui.Select({items: ['COPERNICUS/DEM/GLO30']}));
  
  // Adicionar painéis à interface do usuário
  panelMain.add(geometryPanel);
  panelMain.add(collectionPanel);
  
  // Definir a função de download
  var downloadTasks = function() {
    // Obter os valores de entrada
    var collectionName = collectionPanel.widgets().get(1).getValue();    

    // Selecionar o conjunto de dados
    var dataset = ee.ImageCollection(collectionName).select('DEM');
    
    // Definir as opções de exportação
    var exportOptions = {
    image: dataset,
    description: 'DEM',
    region: geometry,
    folder: 'DEM',
    fileFormat: 'GeoTIFF',
    scale: 30,
    maxPixels: 2e10
    };

    // Criar a tarefa de exportação
    var task = ee.batch.Export.image.toDrive(exportOptions);

    // Iniciar a tarefa
    task.start();
  };
  
  // Adicionar um botão para iniciar o download
  panelMain.add(ui.Button('Iniciar download', downloadTasks));
  
  ui.root.add(panelMain);
  