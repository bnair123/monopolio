let currentPlayerId = null;

function setCurrentPlayer() {
    currentPlayerId = document.getElementById('player-select').value;
    fetchPlayerInfo();
    fetchProperties();
}

function fetchPlayers() {
    fetch('/api/players')
        .then(response => response.json())
        .then(players => {
            const playerSelect = document.getElementById('player-select');
            const receiverSelect = document.getElementById('receiver-select');
            const rentReceiverSelect = document.getElementById('rent-receiver-select');
            playerSelect.innerHTML = '<option value="">Select a player</option>';
            receiverSelect.innerHTML = '';
            rentReceiverSelect.innerHTML = '';
            players.forEach(player => {
                playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
                if (player.id != currentPlayerId) {
                    receiverSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
                    rentReceiverSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
                }
            });
        });
}

function fetchPlayerInfo() {
    if (!currentPlayerId) return;
    fetch(`/api/players/${currentPlayerId}`)
        .then(response => response.json())
        .then(player => {
            const playerInfo = document.getElementById('player-info');
            playerInfo.innerHTML = `
                <p>Name: ${player.name}</p>
                <p>Balance: $${player.balance}</p>
                <p>Net Worth: $${player.net_worth}</p>
            `;
        });
}

function fetchProperties() {
    if (!currentPlayerId) return;
    fetch('/api/properties')
        .then(response => response.json())
        .then(properties => {
            const propertyList = document.getElementById('property-list');
            const transferProperty = document.getElementById('transfer-property');
            propertyList.innerHTML = '';
            transferProperty.innerHTML = '<option value="">Select a property</option>';
            properties.forEach(property => {
                if (property.owner_id === parseInt(currentPlayerId)) {
                    const buildingSymbol = property.houses === 5 ?
                        '<span class="building-symbol hotel"></span>' :
                        '<span class="building-symbol house"></span>'.repeat(property.houses);
                    propertyList.innerHTML += `
                        <div class="property-item">
                            <div class="property-color-band" style="background-color: ${property.color};"></div>
                            <div class="property-details">
                                ${property.name} - $${property.price}
                                ${buildingSymbol}
                                <button onclick="mortgage(${property.id})">Mortgage</button>
                                <button onclick="unmortgage(${property.id})">Unmortgage</button>
                                <button onclick="buildHouse(${property.id})">Build House</button>
                                ${property.houses === 4 ? `<button onclick="buildHotel(${property.id})">Build Hotel</button>` : ''}
                            </div>
                        </div>
                    `;
                    transferProperty.innerHTML += `<option value="${property.id}">${property.name}</option>`;
                }
            });
        });
}

function transfer() {
    const receiverId = document.getElementById('receiver-select').value;
    const amount = document.getElementById('transfer-amount').value;
    const propertyId = document.getElementById('transfer-property').value;
    fetch('/api/transfers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sender_id: currentPlayerId,
            receiver_id: parseInt(receiverId),
            amount: parseInt(amount),
            property_id: propertyId ? parseInt(propertyId) : null
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Transfer money
function transferMoney() {
    const receiverId = document.getElementById('receiver-select').value;
    const amount = document.getElementById('transfer-amount').value;
    fetch('/api/trades', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            initiator_id: currentPlayerId,
            receiver_id: parseInt(receiverId),
            amount: parseInt(amount)
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Pay rent
function payRent() {
    const receiverId = document.getElementById('rent-receiver-select').value;
    const amount = document.getElementById('rent-amount').value;
    fetch('/api/rent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            payer_id: currentPlayerId,
            receiver_id: parseInt(receiverId),
            amount: parseInt(amount)
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Mortgage a property
function mortgage(propertyId) {
    fetch(`/api/properties/${propertyId}/mortgage`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Unmortgage a property
function unmortgage(propertyId) {
    fetch(`/api/properties/${propertyId}/unmortgage`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Build a house on a property
function buildHouse(propertyId) {
    fetch(`/api/properties/${propertyId}/build`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchPlayerInfo();
        fetchProperties();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Initial fetches
fetchPlayerInfo();
fetchProperties();
fetchPlayers();

setInterval(() => {
    if (currentPlayerId) {
        fetchPlayerInfo();
        fetchProperties();
    }
}, 1000);