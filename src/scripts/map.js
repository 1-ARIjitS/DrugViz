// Initialize the map
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
    });

    return map;
}

// Function to get nearby drug rehabilitation centres
function getNearbyCenters(map, location) {
    const service = new google.maps.places.PlacesService(map);
    const request = {
        location: location,
        radius: '5000',
        type: ['drug_rehabilitation_center']
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach(place => {
                new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name
                });
            });
        }
    });
}

// Function to populate city dropdown based on selected country
function populateCityDropdown(country) {
    const citySelect = document.getElementById("city-select");
    citySelect.innerHTML = '<option value="">Select City</option>';

    // Use a mock API or a real API to get cities for the selected country
    // For simplicity, using a mock API here
    const cities = {
        "USA": ["New York", "Los Angeles", "Chicago"],
        "India": ["Mumbai", "Delhi", "Bangalore"],
        // Add more countries and cities as needed
    };

    if (cities[country]) {
        cities[country].forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.text = city;
            citySelect.appendChild(option);
        });
    }
}

// Event listeners for buttons
document.getElementById("get-help-button").addEventListener("click", () => {
    document.getElementById("map-controls").style.display = "block";
    document.getElementById("map").style.display = "block";
    const selectedCountry = document.getElementById("country-select").value;
    populateCityDropdown(selectedCountry);
});

document.getElementById("use-location-button").addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            const map = initMap();
            map.setCenter(location);
            getNearbyCenters(map, location);
            document.getElementById("show-centers-button").disabled = false;
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

document.getElementById("city-select").addEventListener("change", () => {
    const selectedCity = document.getElementById("city-select").value;
    document.getElementById("show-centers-button").disabled = !selectedCity;
});

document.getElementById("show-centers-button").addEventListener("click", () => {
    const selectedCity = document.getElementById("city-select").value;
    if (selectedCity) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': selectedCity }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                const map = initMap();
                map.setCenter(location);
                getNearbyCenters(map, location);
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    } else {
        alert("Please select a city.");
    }
});
