// Google Maps Places API Key
const GOOGLE_API_KEY = "AIzaSyADSzUCZcZXYQr7DGCQDvWT3kpWzX1XzkM";

// Handle Form Submission
document.getElementById("location-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value;

    if (country && city) {
        // Use the Geocoding API to get latitude and longitude for the specified city and country
        geocodeLocation(`${city}, ${country}`, (lat, lng) => {
            console.log(`Geocoded Location: ${lat}, ${lng}`); // Log the geocoded location
            findRehabilitationCenters(null, lat, lng, false); // Use the geocoded location
        });
    }
});

// Handle Current Location
document.getElementById("use-location").addEventListener("click", function () {
    const lat = 48.71005124719624;
    const lng = 2.1671401542209954;
    console.log(`Using Fixed Location: ${lat}, ${lng}`); // Log the fixed location for debugging
    findRehabilitationCenters(null, lat, lng, true);
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
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "Searching...";

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=rehabilitation+center&key=${GOOGLE_API_KEY}`;

    if (location) {
        url += `&query=${encodeURIComponent(location)}`;
    } else if (lat && lng) {
        url += `&location=${lat},${lng}&radius=20000`; // 20 km radius
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
                resultsDiv.innerHTML = `An error occurred: ${data.status} - ${data.error_message}`;
                return;
            }
            if (data.results && data.results.length > 0) {
                const centers = data.results.slice(0, 10); // Limit to 10 results
                resultsDiv.innerHTML = "<h3>Nearest Rehabilitation Centers:</h3><ul>";
                centers.forEach((center) => {
                    let distance = "";
                    if (useCurrentLocation && lat && lng) {
                        const centerLat = center.geometry.location.lat;
                        const centerLng = center.geometry.location.lng;
                        distance = ` - Distance: ${calculateDistance(lat, lng, centerLat, centerLng).toFixed(2)} km`;
                        console.log(`Distance from (${lat}, ${lng}) to (${centerLat}, ${centerLng}): ${distance} km`); // Log the distance for debugging
                    }
                    resultsDiv.innerHTML += `<li>${center.name} - ${center.formatted_address} - Rating: ${center.rating || 'N/A'}${distance} - Coordinates: (${center.geometry.location.lat}, ${center.geometry.location.lng})</li>`;
                });
                resultsDiv.innerHTML += "</ul>";
            } else {
                resultsDiv.innerHTML = "No rehabilitation centers found in the specified area.";
            }
        })
        .catch((error) => {
            resultsDiv.innerHTML = "An error occurred while fetching the data.";
            console.error("Fetch error:", error);
        });
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
