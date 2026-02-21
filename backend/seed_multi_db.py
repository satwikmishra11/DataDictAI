from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import declarative_base

# HR Systems Schema
BaseHR = declarative_base()
class Department(BaseHR):
    __tablename__ = 'departments'
    id = Column(Integer, primary_key=True)
    dept_name = Column(String)

class Employee(BaseHR):
    __tablename__ = 'employees'
    id = Column(Integer, primary_key=True)
    full_name = Column(String)
    email = Column(String)
    dept_id = Column(Integer, ForeignKey('departments.id'))

# Inventory Schema
BaseInv = declarative_base()
class Warehouse(BaseInv):
    __tablename__ = 'warehouses'
    id = Column(Integer, primary_key=True)
    location = Column(String)

class Stock(BaseInv):
    __tablename__ = 'stock_levels'
    id = Column(Integer, primary_key=True)
    product_sku = Column(String)
    quantity = Column(Integer)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id'))

def seed():
    # HR
    url_hr = "postgresql://postgres:postgres@db:5432/hr_systems"
    engine_hr = create_engine(url_hr)
    BaseHR.metadata.drop_all(engine_hr)
    BaseHR.metadata.create_all(engine_hr)
    print("HR Systems Seeded.")

    # Inventory
    url_inv = "postgresql://postgres:postgres@db:5432/inventory_db"
    engine_inv = create_engine(url_inv)
    BaseInv.metadata.drop_all(engine_inv)
    BaseInv.metadata.create_all(engine_inv)
    print("Inventory Seeded.")

if __name__ == "__main__":
    seed()
