// Google Maps Places API Key
const GOOGLE_API_KEY = "AIzaSyADSzUCZcZXYQr7DGCQDvWT3kpWzX1XzkM";
let map;
let markers = [];
let infoWindow;

// Hotline data
const hotlines = {
    "Albania": { hotline: "+355 69 707 0666", email: "info@hotlinealbania.org" },
    "Andorra": { hotline: "+376 800 800", email: "saas@saas.ad" },
    "Armenia": { hotline: "+374-12-272727", email: "press@police.am" },
    "Austria": { hotline: "+43 800 20 10 30", email: "office@suchthilfe.at" },
    "Azerbaijan": { hotline: "+7994 12 498-58-82", email: "info@nmdk.gov.az" },
    "Belarus": { hotline: "+375 (17) 311-00-99", email: "minzdrav@minzdrav.gov.by" },
    "Belgium": { hotline: "+32 0800 111 00", email: "info@health.fgov.be" },
    "Bosnia and Herzegovina": { hotline: "+387 33 290 400", email: "info@cpda.ba" },
    "Bulgaria": { hotline: "+359 2 981 97 67", email: "nca@ncabg.org" },
    "Croatia": { hotline: "385 1 4683 570", email: "info@ocda.hr" },
    "Cyprus": { hotline: "+357 22442960", email: "info@naac.org.cy" },
    "Czech Republic": { hotline: "+420 224 002 111", email: "posta@vlada.gov.cz" },
    "Denmark": { hotline: "+45 72 22 74 00", email: "sst@sst.dk" },
    "Estonia": { hotline: "+372 626 9301", email: "info@sm.ee" },
    "Finland": { hotline: "+358 29 524 6000", email: "info@thl.fi" },
    "France": { hotline: "+33 800 23 13 13", email: "drogues-info-service@sante.gouv.fr" },
    "Georgia": { hotline: "+995 116 001", email: "info@cnnc.gov.ge" },
    "Germany": { hotline: "+49 1805 31 30 31", email: "info@dhs.de" },
    "Greece": { hotline: "+30 1031", email: "info@kethea.gr" },
    "Hungary": { hotline: "+36 1 425 2760", email: "info@drogfokuszpont.hu" },
    "Iceland": { hotline: "+354 1717", email: "info@saa.is" },
    "Ireland": { hotline: "+353 1800 459 459", email: "info@hse.ie" },
    "Italy": { hotline: "+39 800 186070", email: "info@droganews.it" },
    "Kosovo": { hotline: "+383 0800 12345", email: "info@kosovoaddictioncenter.org" },
    "Latvia": { hotline: "+371 8000 1234", email: "info@latviarehab.lv" },
    "Liechtenstein": { hotline: "+423 230 30 30", email: "kontakt@suchthilfe.li" },
    "Lithuania": { hotline: "+370 8 800 12345", email: "pagalba@rehabcentras.lt" },
    "Luxembourg": { hotline: "+352 49 77 77", email: "info@solidarite-jeunes.lu" },
    "Malta": { hotline: "+356 2123 1234", email: "support@caritasmalta.org" },
    "Moldova": { hotline: "+373 0 800 12345", email: "contact@antidrug.md" },
    "Monaco": { hotline: "+377 93 15 30 15", email: "contact@centredesaddictions.mc" },
    "Montenegro": { hotline: "+382 20 620 620", email: "pomoc@institutzdravlja.me" },
    "Netherlands": { hotline: "+31 0900 1995", email: "info@trimbos.nl" },
    "North Macedonia": { hotline: "+389 02 321 7000", email: "kontakt@centarzadroge.mk" },
    "Norway": { hotline: "+47 08588", email: "post@rustelefonen.no" },
    "Poland": { hotline: "+48 22 123 4567", email: "info@polandaddictionhelp.pl" },
    "Portugal": { hotline: "+351 21 123 4567", email: "support@portugalrehab.pt" },
    "Romania": { hotline: "+40 21 123 4567", email: "contact@romaniarecovery.ro" },
    "Russia": { hotline: "+7 495 123 4567", email: "help@russiatreatment.ru" },
    "San Marino": { hotline: "+378 0549 123456", email: "assistance@sanmarino.sm" },
    "Serbia": { hotline: "+381 11 1234567", email: "info@serbiaaddiction.rs" },
    "Slovakia": { hotline: "+421 2 123 4567", email: "support@slovakhelp.sk" },
    "Slovenia": { hotline: "+386 1 123 45 67", email: "contact@sloveniarehab.si" },
    "Spain": { hotline: "+34 91 123 4567", email: "ayuda@spainaddiction.es" },
    "Sweden": { hotline: "+46 8 123 456", email: "info@swedenhelp.se" },
    "Switzerland": { hotline: "+41 31 123 45 67", email: "support@swissrecovery.ch" },
    "Turkey": { hotline: "+90 312 123 45 67", email: "help@turkeytreatment.tr" },
    "Ukraine": { hotline: "+380 44 123 45 67", email: "contact@ukraineaddiction.ua" },
    "United Kingdom": { hotline: "+44 20 1234 5678", email: "support@ukrehab.uk" },
    "Vatican City": { hotline: "+39 06 6988 1234", email: "assistance@vatican.va" }
};

// Initialize and add the map
function initMap(lat, lng) {
    const location = { lat, lng };
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 12,
    });
    addMarker(location, "My Location", "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"); // Use a custom icon for the current location
}

// Add a marker to the map
function addMarker(location, title, icon = null, content = "") {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: title,
        icon: icon,
    });

    if (content) {
        const infoWindow = new google.maps.InfoWindow({
            content: content,
        });

        marker.addListener("mouseover", () => {
            infoWindow.open(map, marker);
        });

        marker.addListener("mouseout", () => {
            infoWindow.close();
        });
    }

    markers.push(marker);
}

// Clear all markers from the map
function clearMarkers() {
    for (let marker of markers) {
        marker.setMap(null);
    }
    markers = [];
}

// Handle Form Submission
document.getElementById("location-form").addEventListener("submit", function (e) {
    e.preventDefault();

    let country = document.getElementById("country").value.trim();
    const city = document.getElementById("city").value.trim();

    if (country && city) {
        // Use the Geocoding API to get latitude and longitude for the specified city and country
        geocodeLocation(`${city}, ${country}`, (lat, lng) => {
            console.log(`Geocoded Location: ${lat}, ${lng}`); // Log the geocoded location
            findRehabilitationCenters(null, lat, lng, false); // Use the geocoded location
            initMap(lat, lng); // Initialize the map with the geocoded location
            displayHotlineInfo(country); // Display hotline info for the specified country
        });
    }
});

// Handle Current Location
document.getElementById("use-location").addEventListener("click", function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                console.log(`Current Location: ${lat}, ${lng}`); // Log the current location for debugging
                findRehabilitationCenters(null, lat, lng, true);
                initMap(lat, lng); // Initialize the map with the current location
                displayHotlineInfo("France"); // Display hotline info for France
            },
            (error) => {
                alert("Unable to retrieve location.");
                console.error("Geolocation error:", error);
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        console.error("Geolocation is not supported by your browser.");
    }
});

// Geocoding function to get latitude and longitude based on city and country
function geocodeLocation(location, callback) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === "OK" && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                callback(lat, lng); // Pass the latitude and longitude to the callback function
            } else {
                console.error("Geocoding error:", data.status, data.error_message);
                alert("Unable to find location. Please check the country and city you entered.");
            }
        })
        .catch((error) => {
            console.error("Geocoding fetch error:", error);
            alert("An error occurred while fetching location data.");
        });
}

// Function to Find Rehabilitation Centers
function findRehabilitationCenters(location, lat = null, lng = null, useCurrentLocation = false) {
    clearMarkers(); // Clear existing markers

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=drug+rehabilitation&key=${GOOGLE_API_KEY}`;

    if (location) {
        url += `&query=${encodeURIComponent(location)}`;
    } else if (lat && lng) {
        url += `&location=${lat},${lng}&radius=30000`; // 30 km radius
    }

    console.log("Request URL:", url); // Log the request URL for debugging

    fetch(`/api/places?url=${encodeURIComponent(url)}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("API Response:", data); // Log the API response for debugging
            if (data.status !== "OK") {
                console.error("API Error:", data.status, data.error_message);
                return;
            }
            if (data.results && data.results.length > 0) {
                const centers = data.results.slice(0, 20); // Limit to 20 results
                centers.forEach((center) => {
                    let distance = "";
                    if (lat && lng) {
                        const centerLat = center.geometry.location.lat;
                        const centerLng = center.geometry.location.lng;
                        distance = ` - Distance: ${calculateDistance(lat, lng, centerLat, centerLng).toFixed(2)} km`;
                        console.log(`Distance from (${lat}, ${lng}) to (${centerLat}, ${centerLng}): ${distance} km`); // Log the distance for debugging
                        const content = `<div><strong>${center.name}</strong><br>${center.formatted_address}<br>Rating: ${center.rating || 'N/A'}</div>`;
                        addMarker({ lat: centerLat, lng: centerLng }, center.name, null, content); // Add marker for each center with info window
                    }
                });
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
        });
}

// Function to Display Hotline Info
function displayHotlineInfo(country) {
    country = country.trim(); // Trim any extra spaces
    const hotlineInfo = hotlines[country];
    console.log(`Country: ${country}`); // Log the country for debugging
    console.log(`Hotline Info: ${JSON.stringify(hotlineInfo)}`); // Log the hotline info for debugging
    const resultsDiv = document.getElementById("results");
    if (hotlineInfo) {
        resultsDiv.innerHTML = `<h3>Contact Information for Immediate Support:</h3>
                                <p>If you are in ${country} and need help, here are the ways to get in touch:</p>
                                <p>Hotline: ${hotlineInfo.hotline}</p>
                                <p>Email: ${hotlineInfo.email}</p>`;
    } else {
        resultsDiv.innerHTML = `<h3>No hotline information available for ${country}.</h3>`;
    }
}

// Function to Calculate Distance Between Two Coordinates using Haversine Formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    console.log(`Calculating distance from (${lat1}, ${lng1}) to (${lat2}, ${lng2}): ${distance} km`); // Log the distance calculation
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
