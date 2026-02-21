import pandas as pd
import numpy as np
from sqlalchemy import create_engine, inspect
from typing import Dict, List, Any

class MetadataService:
    @staticmethod
    def extract_schema(connection_url: str) -> List[Dict[str, Any]]:
        engine = create_engine(connection_url)
        inspector = inspect(engine)
        
        schemas = []
        for schema_name in inspector.get_schema_names():
            if schema_name in ["information_schema", "pg_catalog"]:
                continue
                
            for table_name in inspector.get_table_names(schema=schema_name):
                columns = inspector.get_columns(table_name, schema=schema_name)
                # Convert type objects to strings for JSON serialization
                for col in columns:
                    col['type'] = str(col['type'])
                
                fks = inspector.get_foreign_keys(table_name, schema=schema_name)
                
                schemas.append({
                    "schema_name": schema_name,
                    "table_name": table_name,
                    "columns": columns,
                    "relationships": fks
                })
        return schemas

    @staticmethod
    def profile_data(connection_url: str, schema_name: str, table_name: str) -> Dict[str, Any]:
        engine = create_engine(connection_url)
        # Limit to 1000 rows for profiling
        query = f'SELECT * FROM "{schema_name}"."{table_name}" LIMIT 1000'
        df = pd.read_sql(query, engine)
        
        profile = {}
        for col in df.columns:
            series = df[col]
            profile[col] = {
                "null_rate": series.isnull().mean(),
                "distinct_count": series.nunique(),
                "type": str(series.dtype),
            }
            if pd.api.types.is_numeric_dtype(series):
                profile[col].update({
                    "mean": series.mean(),
                    "std": series.std(),
                    "min": series.min(),
                    "max": series.max(),
                })
        return profile
