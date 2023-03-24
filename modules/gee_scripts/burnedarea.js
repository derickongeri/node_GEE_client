const ee = require("@google/earthengine");
const privateKey = require("../../agristats-378216-b464955961eb.json");
// const { geoJsonObj } = require("./data");

console.log("Authenticating Earth Engine API using private key...");
ee.data.authenticateViaPrivateKey(
  privateKey,
  () => {
    console.log("Authentication successful.");
    ee.initialize(
      null,
      null,
      () => {
        console.log("Earth Engine client library initialized.");
      },
      (err) => {
        console.log(err);
        console.log(
          `Please make sure you have created a service account and have been approved.
Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`
        );
      }
    );
  },
  (err) => {
    console.log(err);
  }
);

const computedNBR = (polygon, dates) => {
  // console.log(ee.Reducer.sum());

  // const parsed = JSON.parse(req.body);
  var geometry = polygon;

  var prefire_start = dates[0].from; // "2023-01-01";
  var prefire_end = dates[0].to; // "2023-01-30";
  var postfire_start = dates[1].from; // "2023-02-15";
  var postfire_end = dates[1].to; // "2023-02-23";
  // var platform = selectPlatform.getValue();
  // var forestBlock = selectBlock.getValue();

  var area = ee.Geometry(geometry);

  var ImCol = "COPERNICUS/S2_SR";

  var imagery = ee.ImageCollection(ImCol);

  // In the following lines imagery will be collected in an ImageCollection, depending on the
  // location of our study area, a given time frame and the ratio of cloud cover.
  var prefireImCol = ee.ImageCollection(
    imagery
      // Filter by dates.
      .filterDate(prefire_start, prefire_end)
      // Filter by location.
      .filterBounds(area)
  );

  // Select all images that overlap with the study area from a given time frame
  // As a post-fire state we select the 25th of February 2017
  var postfireImCol = ee.ImageCollection(
    imagery
      // Filter by dates.
      .filterDate(postfire_start, postfire_end)
      // Filter by location.
      .filterBounds(area)
  );

  // Function to mask clouds from the pixel quality band of Sentinel-2 SR data.
  function maskS2sr(image) {
    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = ee.Number(2).pow(10).int();
    var cirrusBitMask = ee.Number(2).pow(11).int();
    // Get the pixel QA band.
    var qa = image.select("QA60");
    // All flags should be set to zero, indicating clear conditions.
    var mask = qa
      .bitwiseAnd(cloudBitMask)
      .eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    // Return the masked image, scaled to TOA reflectance, without the QA bands.
    return image.updateMask(mask).copyProperties(image, ["system:time_start"]);
  }

  var prefire_CM_ImCol = prefireImCol.map(maskS2sr);
  var postfire_CM_ImCol = postfireImCol.map(maskS2sr);

  var pre_cm_mos = prefire_CM_ImCol.mosaic().clip(area);
  var post_cm_mos = postfire_CM_ImCol.mosaic().clip(area);

  var preNBR = pre_cm_mos.normalizedDifference(["B8", "B12"]);
  var postNBR = post_cm_mos.normalizedDifference(["B8", "B12"]);

  // The result is called delta NBR or dNBR
  var dNBR_unscaled = preNBR.subtract(postNBR);

  // Scale product to USGS standards
  var dNBR = dNBR_unscaled.multiply(1000);

  return [dNBR, post_cm_mos, area];
};

const getGeeRaster = async (req, res) => {
  var geometry = JSON.parse(req.body.geometry);
  var dates = req.body.dates;
  var rasters = computedNBR(geometry, dates);

  //var area = rasters[2]

  var dNBR = rasters[0];

  var post_cm_mos = rasters[1];

  var sld_intervals =
    "<RasterSymbolizer>" +
    '<ColorMap type="intervals" extended="false" >' +
    '<ColorMapEntry color="#ffffff" quantity="-500" label="-500"  />' +
    '<ColorMapEntry color="#7a8737" quantity="-250" label="-250"  />' +
    '<ColorMapEntry color="#acbe4d" quantity="-100" label="-100"  />' +
    '<ColorMapEntry color="#0ae042" quantity="100" label="100" />' +
    '<ColorMapEntry color="#fff70b" quantity="270" label="270" />' +
    '<ColorMapEntry color="#ffaf38" quantity="440" label="440" />' +
    '<ColorMapEntry color="#ff641b" quantity="660" label="660" />' +
    '<ColorMapEntry color="#a41fd6" quantity="2000" label="2000" />' +
    "</ColorMap>" +
    "</RasterSymbolizer>";

  var visParams = {
    opacity: 1,
    bands: ["vis-red", "vis-green", "vis-blue"],
    gamma: 1,
  };

  var sentinelVisParams = {
    bands: ["B4", "B3", "B2"],
    min: 1100,
    max: 1700,
    gamma: 1.5,
  };

  // Get the map ID for the classified dNBR image
  var burnedAreaMap = dNBR.sldStyle(sld_intervals).getMap(visParams);

  // Get the map ID for the pre and post fire images
  var postFireMap = post_cm_mos.getMap(sentinelVisParams);

  var results = { tileList: [burnedAreaMap.mapid, postFireMap.mapid] };

  res.send(results);

  // post_cm_mos.getMap(sentinelVisParams, ({ mapid }) => {
  //   res.send({ tileUrl: mapid });
  //   //console.log(res);
  // });
};

const getEEstats = async (req, res) => {
  var geometry = JSON.parse(req.body.geometry);

  console.log(req.body);

  var dates = req.body.dates;
  var rasters = computedNBR(geometry, dates);

  var dNBR = rasters[0];
  var area = rasters[2];

  try {
    // Seperate result into 8 burn severity classes
    var thresholds = ee.Image([-1000, -251, -101, 99, 269, 439, 659, 2000]);
    var classified = dNBR.lt(thresholds).reduce(ee.Reducer.sum()).toInt();

    //==========================================================================================
    //                              ADD BURNED AREA STATISTICS

    var arealist = [];

    // create a function to derive extent of one burn severity class
    // arguments are class number and class name
    var areacount = function (cnr, name) {
      var singleMask = classified.updateMask(classified.eq(cnr)); // mask a single class

      var stats = singleMask.reduceRegion({
        reducer: ee.Reducer.count(), // count pixels in a single class
        geometry: area,
        scale: 30,
      });
      var pix = ee.Number(stats.get("sum"));
      // var hect = pix.multiply(900).divide(10000); // Landsat pixel = 30m x 30m --> 900 sqm
      // var perc = pix
      //   .divide(allpixels)
      //   .multiply(10000)
      //   .round()
      //   .divide(100); // get area percent by class and round to 2 decimals
      arealist.push({
        Class: name,
        Pixels: pix.getInfo(),
        // Hectares: hect.getInfo(),
        // Percentage: perc.getInfo(),
      });
    };

    // severity classes in different order
    var names2 = [
      "NA",
      "High Severity",
      "Moderate-high Severity",
      "Moderate-low Severity",
      "Low Severity",
      "Unburned",
      "Enhanced Regrowth, Low",
      "Enhanced Regrowth, High",
    ];

    // execute function for each class
    for (var i = 1; i < 5; i++) {
      areacount(i, names2[i]);
    }

    console.log(
      "Burned Area by Severity Class",
      arealist,
      "--> click list objects for individual classes"
    );

    res.send({ stats: arealist });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getGeeRaster,
  getEEstats,
};
