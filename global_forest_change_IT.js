// Calculating forest cover change in protected areas in Italy
// 26th Nov 2018

// Visualise protected areas:
//Map.addLayer(parks);

// Add the Global Forest Change dataset
//Map.addLayer(gfc);

// Set the scale for our calculations to the scale of the Hansen dataset (30 meters)
var scale = gfc.projection().nominalScale();


// Create a variable for the original tree cover (2000)
var treeCover = gfc.select(['treecover2000']);
// Convert the tree cover layer because the treeCover by default is in
// hundreds of hectares, but the loss and gain layers are just in hectares!
treeCover = treeCover.divide(100);
// Create a variable for forest loss
var loss = gfc.select(['loss']);
// Create a variable for forest gain
var gain = gfc.select(['gain']);

// Add the tree cover layer in light grey
Map.addLayer(treeCover.updateMask(treeCover),
{palette: ['D0D0D0', '00FF00'], max: 100}, 'Forest Cover', false);
// Add the loss layer in pink
Map.addLayer(loss.updateMask(loss),
{palette: ['#BF619D']}, 'Loss', false);
// Add the gain layer in yellow
Map.addLayer(gain.updateMask(gain),
{palette: ['#CE9E5D']}, 'Gain', false);

// The units of the variables are numbers of pixels
// Convert the pixels into actual area
// Dividing by 10 000 so that the final result is in ha
var areaCover = treeCover.multiply(ee.Image.pixelArea())
.divide(10000).select([0],["areacover"]);
var areaLoss = loss.gt(0).multiply(ee.Image.pixelArea()).multiply(treeCover)
.divide(10000).select([0],["arealoss"]);
var areaGain = gain.gt(0).multiply(ee.Image.pixelArea()).multiply(treeCover)
.divide(10000).select([0],["areagain"]);

// Create a variable that has the polygons for the UK
var parks = parks.filter(ee.Filter.or(
ee.Filter.eq("ISO3", "ITA"))); //change to select a different country

// Get an array of all "NAME" values from the filtered parks collection
var parkNames = parks.aggregate_array("NAME");

// Print the list of protected areas names
print("List of Park Names:", parkNames);

// Select a specific Protected Area
var parksSelection = parks.filter(
  ee.Filter.and(
    ee.Filter.eq("ISO3", "ITA"),//change to select a different country
    ee.Filter.eq("NAME", "Arcipelago La Maddalena")
    )
);

// Zoom to AOI
Map.addLayer(parks, {color: 'green'}, "Italy Protected Areas");
//Map.centerObject(parks, 10);

// Zoom to AOI
Map.addLayer(parksSelection, {color: 'red'}, "Selected Protected Area");
//Map.centerObject(parks, 20);

// Sum the values of loss pixels
var statsLoss = areaLoss.reduceRegions({
reducer: ee.Reducer.sum(),
collection: parksSelection,
scale: scale
});
// Sum the values of gain pixels
var statsGain = areaGain.reduceRegions({
reducer: ee.Reducer.sum(),
collection: parksSelection,
scale: scale
});

print(statsGain);

Export.table.toDrive({
collection: statsLoss,
description: 'PA_forest_loss'});

Export.table.toDrive({
collection: statsGain,
description: 'PA_forest_gain'});


// Create a bar chart of forest loss by PA Designation
var chartLoss = ui.Chart.feature.byFeature({
  features: statsLoss,
  xProperty: 'DESIG_ENG',
  yProperties: ['sum']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Forest Loss by PA Designation',
  hAxis: {title: 'Designation of the PA'},
  vAxis: {title: 'Total Forest Loss'},
  colors: ['red']
});

// Print the chart to the Console
print(chartLoss);


// Create a bar chart of forest loss by PA Designation
var chartGain = ui.Chart.feature.byFeature({
  features: statsGain,
  xProperty: 'DESIG_ENG',
  yProperties: ['sum']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Forest Loss by PA Designation',
  hAxis: {title: 'Designation of the PA'},
  vAxis: {title: 'Total Forest Gain'},
  colors: ['green']
});

// Print the chart to the Console
print(chartGain);