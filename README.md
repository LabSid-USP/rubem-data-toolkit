# RUBEM Data Toolkit

## Overview

RUBEM Data Toolkit is a collection of Google Earth Engine (GEE) applications designed to extract, process and export climate and soil physical-hydraulic data. Leveraging GEE’s extensive satellite and model collections (NASA, INMET, EMBRAPA, IBGE, etc.), these apps automate generation of time-series and spatial layers for NDVI, precipitation, evapotranspiration, relative humidity, wind speed, crop coefficient (Kₚ), digital elevation (DEM) and soil properties (clay, porosity, wilting point, rootzone depth, bulk density, saturated hydraulic conductivity, saturated content, organic matter, silt, field capacity, fine sand and coarse sand).

> [!NOTE]
> This toolkit was originally developed to support the construction of input datasets for the [**RUBEM**](https://github.com/LabSid-USP/RUBEM)[^MELLOetal2022a][^MELLOetal2022b] distributed hydrological model. [**RUBEM**](https://github.com/LabSid-USP/RUBEM) is based on equations that represent the physical processes of the hydrological cycle, with spatial distribution defined by pixel, in distinct vegetated and non-vegetated covers, and has the flexibility to study a wide range of applications, including impacts of changes in climate and land use, has flexible spatial resolution, the inputs are raster-type matrix files obtained from remote sensing data and operates with a reduced number of parameters arranged in a configuration file that facilitates its modification throughout the area.
> 
> For more information about the RUBEM model, please refer to the following resources:
> 
> - [Méllo Júnior et al. (2022)](https://doi.org/10.3390/w14121958)
> - [Documentation and Tutorials](https://rubem.readthedocs.io/en/latest/)
> - [Documentation and Tutorials (QGIS Plugin)](https://rubem-hydrological.readthedocs.io/en/latest/)
> - [YouTube Playlist (Model Overview & Tutorials)](https://www.youtube.com/watch?v=715KzOsr6M4&list=PL3Wazcs1VbKlM6N4Q8A8Pry7Aoug9v-Fl)

## Prerequisites

- A Google Earth Engine account;
- GEE Code Editor (https://code.earthengine.google.com);
- `users/fitoprincipe/geetools:batch` and `users/gena/packages:palettes` imported.

## Getting Started

1. Open the desired script in the GEE Code Editor;
2. Rename or import your study area as a feature named `geometry`;
3. Adjust date range, collection selectors and visualization parameters;
4. Click **Run**;
5. Use the on-screen buttons to generate charts or export data to Drive.

## Usage Examples

- **NDVI**: compute monthly mean, min or max and export GeoTIFF time-series;
- **Precipitation**: count rainy days (Xavier) or sum monthly totals;
- **Evapotranspiration**: derive from TerraClimate PET band and chart monthly trends;
- **Soil Properties**: select from EMBRAPA/IBGE assets and export physical-hydraulic maps.

## Contributing

Feel free to submit issues or pull requests to extend functionality, add new data sources or improve the UI.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.


<!-- MARKDOWN REFERENCES -->
[^MELLOetal2022a]: Méllo Júnior, A.V.; Olivos, L.M.O.; Billerbeck, C.; Marcellini, S.S.; Vichete, W.D.; Pasetti, D.M.; da Silva, L.M.; Soares, G.A.d.S.; Tercini, J.R.B. Rainfall Runoff Balance Enhanced Model Applied to Tropical Hydrology. Water 2022, 14, 1958. https://doi.org/10.3390/w14121958

[^MELLOetal2022b]: Méllo Júnior, A.V.; Olivos, L.M.O.; Billerbeck, C.; Marcellini, S.S.; Vichete, W.D.; Pasetti, D.M.; da Silva, L.M.; Soares, G.A.d.S.; Tercini, J.R.B. Rainfall-Runoff Balance Enhanced Model Applied to Tropical Hydrology - Supplementary Document. Zenodo 2022. https://doi.org/10.5281/zenodo.6614981
