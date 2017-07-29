//////// Customize this data! /////////
//
var startpoint = "Home, 7475 Brentcove Circle, Dallas, TX 75214"; // Commute starting address
var endpoint = "Dallas County Records Building, 509 Main St Ste 200, Dallas, TX 75202"; // Commute ending address
var trafficlowthreshold = 1; // If traffic adds 3 min. or less to commute, traffic is "low."
var traffichighthreshold = 3; // If traffic adds 10 min. or more to commute, traffic is "high." If traffic adds between 3 and 10 minutes to commute, traffic is "medium."
var refreshrate = 5; // Traffic data is updated every 5 minutes.
//var myparticleemail = "kimhall@worldtweak.com" // The email address you use to log in to build.particle.io. if you have token, you don't need this.
//var myparticlepw = "7521s1st3r!PE" // The password you use to log in to build.particle.io. see git hub for information regardin how to deploy to Azure. 
var myparticletoken = "d7c1b339d7daae4d27dc449f378ee88841d11974" // Photon token (build.particle.io > Settings)if you deploy to Azure process.env.nameOfVariable.
var mybingmapskey = "Aj0HkOdIWyiuN9aYMWPw~7BdfH2cngVT30ybDW5En9Q~AnTjOhp0JoPpMQ5oM07vYsRNvICqaPrmmMCS3kGY7ifYjn_oRddQMZFtUI9ewjCo" // Bing Maps API Key (bingmapsportal.com)
//https://github.com/hxlnt/iot4eta//
///////////////////////////////////////

// Set up Photon

var Particle = require("particle-api-js");
var particle = new Particle();
//particle.login({ username: myparticleemail, password: myparticlepw });

// Set up Bing Maps API and traffic data

var http = require("http");
var url = "http://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=" + startpoint + "&wp.1=" + endpoint + "&key=" + mybingmapskey
var triplength,
    normallength,
    trafficrating;

// Get traffic estimate from Bing Maps API and publish to Photon

function getTraffic() {
    var request = http.get(url, function (response) {
        var buffer = "",
            data;
        response.on("data", function (chunk) { buffer += chunk; });
        response.on("end", function (err) {
            data = JSON.parse(buffer);

            // Compare route with and without current traffic delays to determine traffic rating (low, med, high)

            triplength = data.resourceSets[0].resources[0].travelDurationTraffic / 60; 
            normallength = data.resourceSets[0].resources[0].travelDuration / 60;
            if (normallength + trafficlowthreshold >= triplength) {
                console.log("Little to no traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "low";
            }
            else if (normallength + trafficlowthreshold < triplength && normallength + traffichighthreshold > triplength) {
                console.log("Moderate traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "med";
            }
            else if (normallength + traffichighthreshold <= triplength) {
                console.log("Heavy traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "high";
            }

            // Publish traffic rating to Photon

            var publishEventPr = particle.publishEvent({ name: 'traffic', data: trafficrating, auth: myparticletoken });
            publishEventPr.then(
                function (data) {
                    console.log("Publishing to Photon...");
                },
                function (err) {
                    console.log("Failed to publish event. :(");
                }
            );
        });
    });
}
getTraffic();

// Refresh and republish

setInterval(getTraffic, [refreshrate * 60 * 1000]);
