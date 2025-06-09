# RUBEM Data Toolkit

## Overview

RUBEM Data Toolkit is a collection of Google Earth Engine (GEE) applications designed to extract, process and export climate and soil physical-hydraulic data. Leveraging GEE’s extensive satellite and model collections (NASA, INMET, EMBRAPA, IBGE, etc.), these apps automate generation of time-series and spatial layers for NDVI, precipitation, evapotranspiration, relative humidity, wind speed, crop coefficient (Kₚ), digital elevation (DEM) and soil properties (clay, porosity, wilting point, rootzone depth, bulk density, saturated hydraulic conductivity, saturated content, organic matter, silt, field capacity, fine sand and coarse sand).

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
