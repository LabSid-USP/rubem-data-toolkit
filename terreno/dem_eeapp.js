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
// RUBEM ToolKit dataset input process
// 
// Digital Terrain Elevation (DEM)
//
// Distributed hydrological model
// https://doi.org/10.3390/w14121958
// Documentation and tutorials: 
// https://rubem-hydrological.readthedocs.io/en/latest/
// *youtube link*

// centralizar e adicionar o mapa na área de interesse 
Map.centerObject(geometry);
var hydro = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins/hybas_5');
var visualization = {
  color: '00FFFF',
  strokeWidth: 5
};
Map.addLayer(hydro, visualization, 'Basins')
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
  var collectionPanel = ui.Panel();
  
// imagem do painel
var imageUrl = 'https://labsid.poli.usp.br/wp-content/uploads/sites/1206/2019/06/LogoLabSid.svg'
var imagePanel = ui.Panel({
    widgets: [
        ui.Label({
            value: 'RUBEM TOOLKIT: TERRENO - DEM',
            style: {fontWeight: 'bold', fontSize: '16px'}
        }),
        ui.Thumbnail({
            image: ee.Image.load(imageUrl),
            params: {
                dimensions: '360x110'
            },
            style: {stretch: 'both'}
        })
    ],
    style: {
        padding: '10xp'
    }
});

  // Adicionar widgets para entrada de dados

  geometryPanel.add(ui.Label('Portugues: Desenhe ou insira uma área da aba assets e renomei a variavel `table´ para `geometry´'));
  
  geometryPanel.add(ui.Label('English: Draw or insert your asset of the area named as `geometry´'));
   
  collectionPanel.add(ui.Label('Selecione o sensor (select the sensor):'));
  
  collectionPanel.add(ui.Select({items: ['COPERNICUS/DEM/GLO30']}));
  
  // Adicionar painéis à interface do usuário
  panelMain.add(imagePanel);
  panelMain.add(geometryPanel);
  panelMain.add(collectionPanel);
  
  // Definir a função de download
  var downloadTasks = function() {
    // Obter os valores de entrada
    var collectionName = collectionPanel.widgets().get(1).getValue();    

    var dataset = ee.ImageCollection(collectionName);
    var filtered = dataset.filter(ee.Filter.bounds(geometry)).select('DEM');
    var image = filtered.reduce(ee.Reducer.max());
    var clipped = image.clip(geometry);
    
    // Definir as opções de exportação
    var exportOptions = {
      image: clipped,
      description: 'DEM',
      region: geometry,
      folder: 'RUBEM/INPUT/DEM',
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
  