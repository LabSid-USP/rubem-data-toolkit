/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-48.59743298334432, -22.00164843259342],
          [-48.59743298334432, -23.722516993915946],
          [-45.47731579584432, -23.722516993915946],
          [-45.47731579584432, -22.00164843259342]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var raster_bulk_density = ee.Image("projects/rubem-workspace-462117/assets/soil/Bulk_Density");
var raster_clay = ee.Image("projects/rubem-workspace-462117/assets/soil/Clay");
var raster_coarse_sand = ee.Image("projects/rubem-workspace-462117/assets/soil/Coarse_Sand");
var raster_field_capacity = ee.Image("projects/rubem-workspace-462117/assets/soil/Field_Capacity");
var raster_fine_sand = ee.Image("projects/rubem-workspace-462117/assets/soil/Fine_Sand");
var raster_organic_matter = ee.Image("projects/rubem-workspace-462117/assets/soil/Organic_Matter");
var raster_porosity = ee.Image("projects/rubem-workspace-462117/assets/soil/Porosity");
var raster_rootzone_depth = ee.Image("projects/rubem-workspace-462117/assets/soil/Rootzone_Depth");
var raster_sat_hydraulic_conductivity = ee.Image("projects/rubem-workspace-462117/assets/soil/Sat_Hyd_Conductivity");
var raster_saturated_content = ee.Image("projects/rubem-workspace-462117/assets/soil/Saturated_Content");
var raster_silt = ee.Image("projects/rubem-workspace-462117/assets/soil/Silt");
var raster_wilting_point = ee.Image("projects/rubem-workspace-462117/assets/soil/Wilting_Point");

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
  
  var availableProperties = {
    'Clay': {
      description: 'clay',
      fileNamePrefix: 'clay',
      asset: raster_clay
    },   
    'Porosity': {
      description: 'porosity',
      fileNamePrefix: 'porosity',
      asset: raster_porosity
    },  
    'Wilting Point': {
      description: 'wilting_point',
      fileNamePrefix: 'wilting_point',
      asset: raster_wilting_point
    },      
    'Rootzone Depth': {
      description: 'rootzone_depth',
      fileNamePrefix: 'rootzone_depth',
      asset: raster_rootzone_depth
    },      
    'Bulk Density': {
      description: 'bulk_density',
      fileNamePrefix: 'bulk_density',
      asset: raster_bulk_density
    },      
    'Saturated Hydraulic Conductivity': {
      description: 'sat_hydraulic_conductivity',
      fileNamePrefix: 'sat_hydraulic_conductivity',
      asset: raster_sat_hydraulic_conductivity
    },     
    'Saturated Content': {
      description: 'saturated_content',
      fileNamePrefix: 'saturated_content',
      asset: raster_saturated_content
    },      
    'Organic Matter': {
      description: 'organic_matter',
      fileNamePrefix: 'organic_matter',
      asset: raster_organic_matter
    },       
    'Silt': {
      description: 'silt',
      fileNamePrefix: 'silt',
      asset: raster_silt
    },     
    'Field Capacity': {
      description: 'field_capacity',
      fileNamePrefix: 'field_capacity',
      asset: raster_field_capacity
    },         
    'Fine Sand': {
      description: 'fine_sand',
      fileNamePrefix: 'fine_sand',
      asset: raster_fine_sand
    },
    'Coarse Sand': {
      description: 'coarse_sand',
      fileNamePrefix: 'coarse_sand',      
      asset: raster_coarse_sand
    },
  };
  
  var clippedImage; 
  var selectedProperty;
  propertiesPanel.add(ui.Label('Propriedade do Solo'));
  propertiesPanel.add(ui.Select(
    {
      items: Object.keys(availableProperties),
      placeholder: 'Selecione a propriedade',
      onChange: function(selectedItem){
        selectedProperty = selectedItem;
        var selectedImage = availableProperties[selectedItem]['asset'];
        clippedImage = selectedImage.clip(geometry);
        Map.clear();
        Map.addLayer(clippedImage, {}, availableProperties[selectedItem]['nomeExibicao']);
      }
    }));
  
  // Adicionar painéis à interface do usuário
  panelMain.add(geometryPanel);
  panelMain.add(propertiesPanel);
  
  // Definir a função de download
  var downloadTasks = function() {
    // Obter os valores de entrada

    // Definir as opções de exportação
    var exportOptions = {
      image: clippedImage,
      description: availableProperties[selectedProperty]['description'],
      region: geometry,
      folder: 'RUBEM_DATA_TOOLKIT',
      fileFormat: 'GeoTIFF',
      fileNamePrefix: availableProperties[selectedProperty]['fileNamePrefix'],
      scale: 30,
      maxPixels: 2e10
    };

    // Criar a tarefa de exportação
    Export.image.toDrive(exportOptions);
  };
  
  // Adicionar um botão para iniciar o download
  panelMain.add(ui.Button('Iniciar download', downloadTasks));
  
  ui.root.add(panelMain);
  
