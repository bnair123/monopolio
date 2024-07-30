from flask import Blueprint, jsonify, request
from models import db, Player, Property, Trade, Game
from sqlalchemy.exc import IntegrityError
import json

api = Blueprint('api', __name__)


@api.route('/players', methods=['GET'])
def get_players():
    players = Player.query.all()
    return jsonify([player.to_dict() for player in players])


@api.route('/players', methods=['POST'])
def create_player():
    data = request.json
    new_player = Player(name=data['name'])
    db.session.add(new_player)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Player name already exists'}), 400
    return jsonify(new_player.to_dict()), 201


@api.route('/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    player = Player.query.get_or_404(player_id)
    return jsonify(player.to_dict())


@api.route('/players/<int:player_id>/balance', methods=['PUT'])
def update_balance(player_id):
    player = Player.query.get_or_404(player_id)
    data = request.json
    player.balance += data['amount']
    db.session.commit()
    return jsonify(player.to_dict())


#@api.route('/properties', methods=['GET'])
#def get_properties():
#    properties = Property.query.all()
 #   return jsonify([prop.to_dict() for prop in properties])

@api.route('/properties', methods=['GET'])
def get_properties():
    properties = Property.query.all()
    property_list = []
    for property in properties:
        property_data = {
            'id': property.id,
            'name': property.name,
            'color': property.color,
            'price': property.price,
            'rent': property.rent,
            'houseCost': property.house_cost,
            'hotelCost': property.hotel_cost,
            'owner_id': property.owner_id,
            'houses': property.houses
        }
        property_list.append(property_data)
    return jsonify(property_list)

@api.route('/properties/<int:property_id>/buy', methods=['POST'])
def buy_property(property_id):
    prop = Property.query.get_or_404(property_id)
    data = request.json
    player = Player.query.get_or_404(data['player_id'])

    if prop.owner_id is not None or player.balance < prop.price:
        return jsonify({'error': 'Unable to buy property'}), 400

    player.balance -= prop.price
    prop.owner_id = player.id
    db.session.commit()
    return jsonify(prop.to_dict())


@api.route('/properties/<int:property_id>/mortgage', methods=['POST'])
def mortgage_property(property_id):
    prop = Property.query.get_or_404(property_id)
    if prop.owner_id is None or prop.is_mortgaged:
        return jsonify({'error': 'Unable to mortgage property'}), 400

    player = Player.query.get(prop.owner_id)
    player.balance += prop.price // 2
    prop.is_mortgaged = True
    db.session.commit()
    return jsonify(prop.to_dict())


@api.route('/properties/<int:property_id>/unmortgage', methods=['POST'])
def unmortgage_property(property_id):
    prop = Property.query.get_or_404(property_id)
    if prop.owner_id is None or not prop.is_mortgaged:
        return jsonify({'error': 'Unable to unmortgage property'}), 400

    player = Player.query.get(prop.owner_id)
    unmortgage_cost = int(prop.price * 0.55)  # 50% of property value + 10% interest
    if player.balance < unmortgage_cost:
        return jsonify({'error': 'Insufficient funds to unmortgage'}), 400

    player.balance -= unmortgage_cost
    prop.is_mortgaged = False
    db.session.commit()
    return jsonify(prop.to_dict())


@api.route('/properties/<int:property_id>/build', methods=['POST'])
def build_house(property_id):
    prop = Property.query.get_or_404(property_id)
    if prop.owner_id is None or prop.is_mortgaged or prop.houses >= 5:
        return jsonify({'error': 'Unable to build house'}), 400

    player = Player.query.get(prop.owner_id)
    if player.balance < prop.house_cost:
        return jsonify({'error': 'Insufficient funds to build house'}), 400

    player.balance -= prop.house_cost
    prop.houses += 1
    db.session.commit()
    return jsonify(prop.to_dict())


@api.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    players = Player.query.order_by(Player.balance.desc()).all()
    return jsonify([{
        'name': player.name,
        'balance': player.balance,
        'net_worth': player.net_worth,
        'rank': index + 1
    } for index, player in enumerate(players)])


@api.route('/trades', methods=['POST'])
def create_trade():
    data = request.json
    new_trade = Trade(
        initiator_id=data['initiator_id'],
        receiver_id=data['receiver_id'],
        amount=data['amount']
    )
    db.session.add(new_trade)
    db.session.commit()
    return jsonify(new_trade.to_dict()), 201


@api.route('/trades/<int:trade_id>', methods=['PUT'])
def respond_to_trade(trade_id):
    trade = Trade.query.get_or_404(trade_id)
    data = request.json
    trade.status = data['status']

    if trade.status == 'accepted':
        initiator = Player.query.get(trade.initiator_id)
        receiver = Player.query.get(trade.receiver_id)
        initiator.balance -= trade.amount
        receiver.balance += trade.amount

    db.session.commit()
    return jsonify(trade.to_dict())


@api.route('/rent', methods=['POST'])
def pay_rent():
    data = request.json
    payer = Player.query.get_or_404(data['payer_id'])
    receiver = Player.query.get_or_404(data['receiver_id'])
    amount = data['amount']

    if payer.balance < amount:
        return jsonify({'error': 'Insufficient funds to pay rent'}), 400

    payer.balance -= amount
    receiver.balance += amount
    db.session.commit()
    return jsonify({
        'payer': payer.to_dict(),
        'receiver': receiver.to_dict()
    })


@api.route('/master/adjust-balance', methods=['POST'])
def master_adjust_balance():
    data = request.json
    player = Player.query.get_or_404(data['player_id'])
    player.balance += data['amount']
    db.session.commit()
    return jsonify(player.to_dict())


@api.route('/game/reset', methods=['POST'])
def reset_game():
    Game.query.delete()
    Player.query.delete()
    Property.query.delete()
    Trade.query.delete()
    new_game = Game(is_active=True)
    db.session.add(new_game)
    db.session.commit()

    # Load properties from JSON file
    with open('property_cards.json', 'r') as f:
        properties_data = json.load(f)

    for prop_data in properties_data:
        new_prop = Property(
            name=prop_data['name'],
            price=prop_data['price'],
            color=prop_data['color'],
            rent_levels=','.join(str(r) for r in prop_data['rent_levels']),
            house_cost=prop_data['house_cost'],
            hotel_cost=prop_data['hotel_cost']
        )
        db.session.add(new_prop)

    db.session.commit()
    return jsonify({'message': 'Game reset successfully'})


@api.route('/properties/give', methods=['POST'])
def give_property():
    data = request.json
    property = Property.query.get_or_404(data['property_id'])
    player = Player.query.get_or_404(data['player_id'])

    if property.owner_id is not None:
        return jsonify({'error': 'Property already owned'}), 400

    if data['payment_method'] in ['cash', 'mix']:
        if player.balance < property.price:
            return jsonify({'error': 'Insufficient funds'}), 400
        player.balance -= property.price

    property.owner_id = player.id
    db.session.commit()
    return jsonify(property.to_dict())


@api.route('/properties/<int:property_id>/build_hotel', methods=['POST'])
def build_hotel(property_id):
    property = Property.query.get_or_404(property_id)
    if property.houses != 4:
        return jsonify({'error': 'Must have 4 houses before building a hotel'}), 400

    player = Player.query.get(property.owner_id)
    if player.balance < property.hotel_cost:
        return jsonify({'error': 'Insufficient funds'}), 400

    player.balance -= property.hotel_cost
    property.houses = 5  # 5 represents a hotel
    db.session.commit()
    return jsonify(property.to_dict())


@api.route('/transfers', methods=['POST'])
def transfer():
    data = request.json
    sender = Player.query.get_or_404(data['sender_id'])
    receiver = Player.query.get_or_404(data['receiver_id'])
    amount = data['amount']
    property_id = data.get('property_id')

    if sender.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    sender.balance -= amount
    receiver.balance += amount

    if property_id:
        property = Property.query.get_or_404(property_id)
        if property.owner_id != sender.id:
            return jsonify({'error': 'Sender does not own this property'}), 400
        property.owner_id = receiver.id

    db.session.commit()
    return jsonify({'message': 'Transfer successful'})


@api.route('/game/end', methods=['POST'])
def end_game():
    game = Game.query.first()
    if game:
        game.is_active = False
        db.session.commit()
        return jsonify({'message': 'Game ended successfully'})
    else:
        return jsonify({'error': 'No active game found'}), 404