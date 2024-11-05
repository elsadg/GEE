// Create a MODIS NDVI timeseries over a specified country//


// Load the administrative boundary dataset
var adminBoundaries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');

// Filter the dataset by country
var Boundary = adminBoundaries.filterMetadata('country_na', 'equals', 'Cambodia');

// Define the region of interest (ROI)
var roi = Boundary.geometry();

// Load the MODIS NDVI collection
var modisNDVI = ee.ImageCollection('MODIS/061/MOD13Q1')
                  .filterDate('2020-01-01', '2023-12-31')
                  .select('NDVI')
                  .filterBounds(roi);
                  
                  
// Define a function to scale NDVI values from 0 to 1
function scaleNDVI(image) {
  // Scale NDVI by dividing by 9000
  var scaledNDVI = image.divide(9000).rename('scaled_NDVI');
  return scaledNDVI.copyProperties(image, ['system:time_start']);
}

// Apply the scaling function to each image in the collection
var modisNDVIscaled = modisNDVI.map(scaleNDVI);

// Define a function to add the date as a band
function addDate(image) {
  var date = ee.Date(image.get('system:time_start'));
  var year = ee.Image(ee.Number(date.get('year'))).rename('year');
  return image.addBands(year);
}

// Map the addDate function over the scaled collection
var modisNDVIwithDate = modisNDVIscaled.map(addDate);

// Calculate the mean NDVI for the ROI over time
var meanNDVI = modisNDVIwithDate.mean().clip(roi);

// Define a function to get the mean scaled NDVI value for each image
var getMeanNDVI = function(image) {
  var mean = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 500, // Adjust the scale based on your needs
    maxPixels: 1e9
  });
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd');
  return ee.Feature(null, {'date': date, 'scaled_NDVI': mean.get('scaled_NDVI')});
};

// Map the getMeanNDVI function over the collection to create a feature collection
var ndviTimeSeries = modisNDVIscaled.map(getMeanNDVI);

// Convert the feature collection to a chart
var chart = ui.Chart.feature.byFeature(ndviTimeSeries, 'date', 'scaled_NDVI')
                .setChartType('LineChart')
                .setOptions({
                  title: 'MODIS NDVI Time Series for Cambodia (2020-2023)',
                  vAxis: {title: 'NDVI'},
                  hAxis: {title: 'Date'},
                  lineWidth: 1,
                  pointSize: 3,
                  series: {
                    0: {color: 'green'},
                  }
                });

// Print the chart to the console
print(chart);

// Export to CSV
Export.table.toDrive({
collection: ndviTimeSeries,
description: 'MODIS_NDVI_timesries'});