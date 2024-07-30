// Fetch and display players
function fetchPlayers() {
    fetch('/api/players')
        .then(response => response.json())
        .then(players => {
            const playerList = document.getElementById('player-list');
            const playerSelect = document.getElementById('player-select');
            const playerPropertySelect = document.getElementById('player-property-select');
            playerList.innerHTML = '';
            playerSelect.innerHTML = '';
            playerPropertySelect.innerHTML = '';
            players.forEach(player => {
                playerList.innerHTML += `<li>${player.name} - $${player.balance}</li>`;
                playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
                playerPropertySelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
            });
        })
        .catch(error => console.error('Error fetching players:', error));
}

// Add a new player
function addPlayer() {
    const playerName = document.getElementById('new-player-name').value;
    fetch('/api/players', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayers();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Adjust player balance
function adjustBalance() {
    const playerId = document.getElementById('player-select').value;
    const amount = document.getElementById('amount').value;
    fetch(`/api/players/${playerId}/balance`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseInt(amount) }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayers();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Fetch and display properties
function fetchProperties() {
    fetch('/api/properties')
        .then(response => response.json())
        .then(properties => {
            const propertySelect = document.getElementById('property-select');
            propertySelect.innerHTML = '<option value="">Select a property</option>';
            properties.forEach(property => {
                if (!property.owner_id) {
                    propertySelect.innerHTML += `<option value="${property.id}">${property.name}</option>`;
                }
            });
            updateAllPropertiesList(properties);
        })
        .catch(error => console.error('Error fetching properties:', error));
}

// Reset the game
function resetGame() {
    fetch('/api/game/reset', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayers();
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// End the game
function endGame() {
    fetch('/api/game/end', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Game ended!');
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
function fetchAllProperties() {
    fetch('/api/properties')
        .then(response => response.json())
        .then(properties => {
            const allPropertiesList = document.getElementById('all-properties-list');
            allPropertiesList.innerHTML = '';
            properties.forEach(property => {
                if (property.owner_id) {
                    const buildingSymbol = property.houses === 5 ?
                        '<span class="building-symbol hotel"></span>' :
                        '<span class="building-symbol house"></span>'.repeat(property.houses);
                    allPropertiesList.innerHTML += `
                        <div class="property-item">
                            <div class="property-color-band" style="background-color: ${property.color};"></div>
                            <div class="property-details">
                                ${property.name} - Owner: Player ${property.owner_id}
                                ${buildingSymbol}
                            </div>
                        </div>
                    `;
                }
            });
        });
}

function updateAllPropertiesList(properties) {
    const allPropertiesList = document.getElementById('all-properties-list');
    allPropertiesList.innerHTML = '';
    properties.forEach(property => {
        const buildingSymbol = property.houses === 5
            ? '<span class="building-symbol hotel"></span>'
            : '<span class="building-symbol house"></span>'.repeat(property.houses);
        allPropertiesList.innerHTML += `
            <div class="property-item">
                <div class="property-color-band" style="background-color: ${property.color};"></div>
                <div class="property-details">
                    ${property.name} - Owner: ${property.owner_id ? `Player ${property.owner_id}` : 'Bank'}
                    ${buildingSymbol}
                    ${property.owner_id ? `
                        <button onclick="addHouse(${property.id})">Add House</button>
                        ${property.houses === 4 ? `<button onclick="addHotel(${property.id})">Add Hotel</button>` : ''}
                    ` : ''}
                </div>
            </div>
        `;
    });
}

function giveProperty() {
    const propertyId = document.getElementById('property-select').value;
    const playerId = document.getElementById('player-property-select').value;
    const paymentMethod = document.getElementById('payment-method').value;
    fetch('/api/properties/give', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, player_id: playerId, payment_method: paymentMethod }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayers();
        fetchProperties();
    })
    .catch(error => console.error('Error giving property:', error));
}

function addHouse(propertyId) {
    fetch(`/api/properties/${propertyId}/build`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function addHotel(propertyId) {
    fetch(`/api/properties/${propertyId}/build_hotel`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Initial fetches
fetchPlayers();
fetchAllProperties();

setInterval(() => {
    fetchPlayers();
    fetchProperties();
}, 1000);