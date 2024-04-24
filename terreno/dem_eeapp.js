/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-107.32890625, 40.43415242959552],
          [-107.32890625, 38.05215559835963],
          [-104.16484375, 38.05215559835963],
          [-104.16484375, 40.43415242959552]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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
  collectionPanel.add(ui.Select({items: ['USGS/SRTMGL1_003']}));
  
  // Adicionar painéis à interface do usuário
  panelMain.add(geometryPanel);
  panelMain.add(collectionPanel);
  
  // Definir a função de download
  var downloadTasks = function() {
    // Obter os valores de entrada
    var collectionName = collectionPanel.widgets().get(1).getValue();    

    // Selecionar o conjunto de dados
    var dataset = ee.Image(collectionName).select('elevation');
    var clippedDem = dataset.clip(geometry);
    
    // Definir as opções de exportação
    var exportOptions = {
    image: clippedDem,
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
  