// Calculating forest cover change in protected areas in Scotland
// Source: CodingClub
// Modified by Elsa
// 26th Nov 2018

// Visualise protected areas:
Map.addLayer(parks);

// Add the Global Forest Change dataset
Map.addLayer(gfc);

// Set the scale for our calculations to the scale of the Hansen dataset
// which is 30m
var scale = gfc.projection().nominalScale();


// Create a variable for the original tree cover in 2000
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
{palette: ['D0D0D0', '00FF00'], max: 100}, 'Forest Cover');
// Add the loss layer in pink
Map.addLayer(loss.updateMask(loss),
{palette: ['#BF619D']}, 'Loss');
// Add the gain layer in yellow
Map.addLayer(gain.updateMask(gain),
{palette: ['#CE9E5D']}, 'Gain');

// The units of the variables are numbers of pixels
// Here we are converting the pixels into actual area
// Dividing by 10 000 so that the final result is in km2
var areaCover = treeCover.multiply(ee.Image.pixelArea())
.divide(10000).select([0],["areacover"]);
var areaLoss = loss.gt(0).multiply(ee.Image.pixelArea()).multiply(treeCover)
.divide(10000).select([0],["arealoss"]);
var areaGain = gain.gt(0).multiply(ee.Image.pixelArea()).multiply(treeCover)
.divide(10000).select([0],["areagain"]);

// Create a variable that has the polygons for just a few
// national parks and nature reserves
var parks = parks.filter(ee.Filter.or(
ee.Filter.eq("NAME", "Yellowstone"),
ee.Filter.eq("NAME", "Cairngorms"),
ee.Filter.eq("NAME", "Sankuru"),
ee.Filter.eq("NAME", "Redwood")));

// Sum the values of loss pixels.
var statsLoss = areaLoss.reduceRegions({
reducer: ee.Reducer.sum(),
collection: parks,
scale: scale
});
// Sum the values of gain pixels.
var statsGain = areaGain.reduceRegions({
reducer: ee.Reducer.sum(),
collection: parks,
scale: scale
});

// Export to Google Drive (forest loss)
Export.table.toDrive({
collection: statsLoss,
description: 'NP_forest_loss'});

// Export to Google Drive (forest gain)
Export.table.toDrive({
collection: statsGain,
description: 'NP_forest_gain'});