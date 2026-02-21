from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import datetime

# Use the internal port for the script since it runs on the host or in container
# We'll use the settings to get the URI
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
Base = declarative_base()

class DemoCustomer(Base):
    __tablename__ = 'demo_customers'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String) # PII Detection will find this

class DemoOrder(Base):
    __tablename__ = 'demo_orders'
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('demo_customers.id'))
    order_date = Column(DateTime, default=datetime.datetime.utcnow)

class DemoProduct(Base):
    __tablename__ = 'demo_products'
    id = Column(Integer, primary_key=True)
    sku = Column(String)
    price = Column(Float)

class DemoOrderItem(Base):
    __tablename__ = 'demo_order_items'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('demo_orders.id'))
    product_id = Column(Integer, ForeignKey('demo_products.id'))
    quantity = Column(Integer)

def seed():
    Base.metadata.create_all(engine)
    print("Demo Lineage Schema created successfully!")

if __name__ == "__main__":
    seed()
