/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-47.01707809665109, -23.73545666228563],
          [-47.12144821383859, -24.427530727253686],
          [-46.24803512790109, -24.03681729651776],
          [-46.35789840915109, -23.65497556446401]]], null, false);

var batch = require('users/fitoprincipe/geetools:batch');
var palettesGeneral = require('users/gena/packages:palettes');

// Parâmetros para correção do asset
var scaleValue = 0.00686666;
var offsetValue = 225.0;

// Função para aplicar correção de escala e offset à banda 'pr'
function applyScaleOffset(image) {
    var corrected = image.select('pr').multiply(scaleValue).add(offsetValue);
    // Sobrescreve a banda 'pr' com o valor corrigido
    return image.addBands(corrected.rename('pr'), null, true);
}

// Criar painéis para entrada de dados
var panelMain = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: { width: '360px', position: 'bottom-left', margin: '0px' }
});

var geometryPanel = ui.Panel();
var datePanel = ui.Panel();
var collectionPanel = ui.Panel();

// Adicionar widgets para entrada de dados
geometryPanel.add(ui.Label('Desenhe o polígono desejado na área do mapa e nomeie a camada como `geometry`.'));
datePanel.add(ui.Label('Digite a data inicial:'));
datePanel.add(ui.Textbox({ placeholder: 'yyyy-mm-dd' }));
datePanel.add(ui.Label('Digite a data final:'));
datePanel.add(ui.Textbox({ placeholder: 'yyyy-mm-dd' }));

collectionPanel.add(ui.Label('Selecione a coleção:'));
collectionPanel.add(ui.Select({ items: ['projects/ee-alexandrexavier/assets/BR-DWGD'] }));

panelMain.add(geometryPanel);
panelMain.add(datePanel);
panelMain.add(collectionPanel);

Map.centerObject(geometry, 5);
Map.addLayer(geometry, {}, 'Geometry');

var palette = palettesGeneral.colorbrewer.Blues[7];
var windVis = { min: 0.0, max: 500.0, palette: palette };

// Função de download
var downloadTasks = function () {
    // Obter os valores de entrada
    var startDate = ee.Date(datePanel.widgets().get(1).getValue());
    var endDate = ee.Date(datePanel.widgets().get(3).getValue());
    var collectionName = collectionPanel.widgets().get(1).getValue();

    // Define o número de meses entre a data inicial e final
    var diff = endDate.difference(startDate, 'month');

    // Cálculo da soma mensal aplicando a correção nos dados
    var monthSum = ee.List.sequence(0, diff).map(function (n) {
        var start = startDate.advance(n, 'month');
        var end = start.advance(1, 'month');
        var col = ee.ImageCollection(collectionName)
            .filterBounds(geometry)
            .filterDate(start, end)
            .map(applyScaleOffset); // Aplica a correção a cada imagem
        return col.sum().set('system:time_start', start.millis());
    });

    // Correção para garantir que apenas a banda 'pr' seja exportada
    var dataset = ee.ImageCollection(monthSum).map(function (image) {
        return ee.Image(image).select('pr').clip(geometry); // Seleciona apenas a banda 'pr'
    });

    // Contagem de dias com chuva (valores > 0) por mês
    var numberOfMonths = endDate.difference(startDate, 'months').ceil();
    var days_over0Collection = ee.ImageCollection(
        ee.List.sequence(0, numberOfMonths.subtract(1))
            .map(days_over0)
    );

    // Correção na função days_over0 para garantir que os valores sejam processados corretamente
    function days_over0(monthOffset) {
        var date = startDate.advance(monthOffset, 'months');
        return ee.ImageCollection(collectionName)
            .filterDate(date, date.advance(1, 'months'))
            .map(applyScaleOffset)
            .select('pr') // Seleciona apenas a banda 'pr'
            .map(function (image) {
                var date1 = image.get('system:time_start');
                var maskzero = image.gt(0); // Máscara para valores maiores que 0
                return image.updateMask(maskzero).set('system:time_start', date1);
            })
            .count()
            .unmask(0) // Substitui valores nulos por 0
            .clip(geometry)
            .set('system:time_start', date.millis(), 'dateYMD', date.format('YYYY-MM-dd'));
    }

    // Agrupar por mês e reduzir pela média
    var months = ee.List.sequence(1, 12);
    var byMonth = ee.ImageCollection.fromImages(
        months.map(function (m) {
            return days_over0Collection.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select(0).mean()
                .set('month', m)
                .set('system:time_start', ee.Date.fromYMD(1, m, 1));
        }));

    // Correção na exportação da tabela de dias chuvosos
    var monthlyRainfall = ee.FeatureCollection(byMonth.map(function (img) {
        var image = ee.Image(img);
        var hasPrBand = image.bandNames().contains('pr'); // Verifica se a banda 'pr' existe
        var value = ee.Algorithms.If(
            hasPrBand,
            image.reduceRegion({
                reducer: ee.Reducer.mean(),
                geometry: geometry,
                scale: 250,
                maxPixels: 1e13 // Garante que grandes áreas sejam processadas
            }).get('pr'), // Obtém apenas a banda 'pr'
            null // Retorna null se a banda 'pr' não existir
        );
        var month = image.get('month');
        return ee.Feature(null).set('pr', value).set('month', month);
    }));

    Export.table.toDrive({
        collection: monthlyRainfall,
        selectors: ['month', 'pr'],
        fileNamePrefix: 'rainy_days',
        fileFormat: 'CSV'
    });

    // Exporta as imagens mensais (soma dos valores de chuva)
    batch.Download.ImageCollection.toDrive(dataset, 'Precipitation', {
        region: geometry,
        crs: 'EPSG:4326',
        type: 'float',
        description: 'imageToDriveExample',
        scale: 250,
        fileFormat: 'GeoTIFF'
    });

    Map.addLayer(dataset.first().select('pr'), windVis, 'Precipitation');

    //Map.addLayer(dataset, windVis, 'Precipitation');

    // Cria a legenda de cores
    function createColorBar(titleText, palette, min, max) {
        var title = ui.Label({
            value: titleText,
            style: { fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal' }
        });

        var legend = ui.Thumbnail({
            image: ee.Image.pixelLonLat().select(0),
            params: { bbox: [0, 0, 1, 0.1], dimensions: '200x20', format: 'png', min: 0, max: 500, palette: palette },
            style: { stretch: 'horizontal', margin: '8px 8px', maxHeight: '40px' },
        });

        var labels = ui.Panel({
            widgets: [
                ui.Label(min, { margin: '4px 10px', textAlign: 'left', stretch: 'horizontal' }),
                ui.Label((min + max) / 2, { margin: '4px 20px', textAlign: 'center', stretch: 'horizontal' }),
                ui.Label(max, { margin: '4px 10px', textAlign: 'right', stretch: 'horizontal' })
            ],
            layout: ui.Panel.Layout.flow('horizontal')
        });

        var legendPanel = ui.Panel({
            widgets: [title, legend, labels],
            style: { position: 'bottom-center', padding: '8px 15px' }
        });
        return legendPanel;
    }

    var colorBar = createColorBar('Precipitation - First Image ', palette, 0, 500);
    Map.add(colorBar);
};

panelMain.add(ui.Button('Iniciar download', downloadTasks));
ui.root.add(panelMain);
