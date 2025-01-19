// Google Maps Places API Key
const GOOGLE_API_KEY = "AIzaSyADSzUCZcZXYQr7DGCQDvWT3kpWzX1XzkM";

// Handle Form Submission
document.getElementById("location-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value;

    if (country && city) {
        findRehabilitationCenters(`${city}, ${country}`);
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
                    }
                    resultsDiv.innerHTML += `<li>${center.name} - ${center.formatted_address} - Rating: ${center.rating || 'N/A'}${distance}</li>`;
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

// Function to Calculate Distance Between Two Coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lat2 - lng1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
