from database import db
from sqlalchemy.ext.hybrid import hybrid_property


class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    balance = db.Column(db.Integer, default=1500)

    @hybrid_property
    def net_worth(self):
        return self.balance + sum([p.value for p in self.properties])

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'balance': self.balance,
            'net_worth': self.net_worth,
            'properties': [p.to_dict() for p in self.properties]
        }


class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    price = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(20), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    is_mortgaged = db.Column(db.Boolean, default=False)
    houses = db.Column(db.Integer, default=0)
    rent_levels = db.Column(db.String(255))  # Stored as comma-separated values
    house_cost = db.Column(db.Integer)
    hotel_cost = db.Column(db.Integer)

    owner = db.relationship('Player', backref=db.backref('properties', lazy=True))

    @hybrid_property
    def value(self):
        return self.price + (self.houses * self.house_cost)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'color': self.color,
            'owner_id': self.owner_id,
            'is_mortgaged': self.is_mortgaged,
            'houses': self.houses,
            'rent_levels': [int(r) for r in self.rent_levels.split(',')],
            'house_cost': self.house_cost,
            'hotel_cost': self.hotel_cost,
            'value': self.value
        }


class Trade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    initiator_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    amount = db.Column(db.Integer)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected

    initiator = db.relationship('Player', foreign_keys=[initiator_id])
    receiver = db.relationship('Player', foreign_keys=[receiver_id])

    def to_dict(self):
        return {
            'id': self.id,
            'initiator_id': self.initiator_id,
            'receiver_id': self.receiver_id,
            'amount': self.amount,
            'status': self.status
        }


class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    is_active = db.Column(db.Boolean, default=True)