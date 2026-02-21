import pandas as pd
import numpy as np
from sqlalchemy import create_engine, inspect, text
from typing import Dict, List, Any
import re

class MetadataService:
    @staticmethod
    def _detect_pii(column_name: str) -> List[str]:
        tags = []
        name_lower = column_name.lower()
        
        patterns = {
            "PII": r"name|first_?name|last_?name|full_?name|maiden_?name",
            "Contact": r"email|phone|mobile|fax|contact",
            "Financial": r"credit_?card|card_?number|cvv|iban|account_?number|routing|salary|tax",
            "Sensitive": r"ssn|social_?security|password|secret|key|token|auth|dob|birth",
            "Location": r"address|city|state|zip|postal|country|lat|lon|geo"
        }
        
        for tag, pattern in patterns.items():
            if re.search(pattern, name_lower):
                tags.append(tag)
        
        return list(set(tags))

    @staticmethod
    def extract_schema(connection_url: str) -> List[Dict[str, Any]]:
        try:
            engine = create_engine(connection_url)
            inspector = inspect(engine)
            
            schemas = []
            try:
                available_schemas = inspector.get_schema_names()
            except:
                available_schemas = ["public"]

            for schema_name in available_schemas:
                if schema_name in ["information_schema", "pg_catalog", "sys", "mysql", "performance_schema"]:
                    continue
                    
                try:
                    table_names = inspector.get_table_names(schema=schema_name)
                except:
                    continue

                for table_name in table_names:
                    try:
                        columns = inspector.get_columns(table_name, schema=schema_name)
                        for col in columns:
                            col['type'] = str(col['type'])
                            # Detect PII
                            col['tags'] = MetadataService._detect_pii(col['name'])
                        
                        try:
                            fks = inspector.get_foreign_keys(table_name, schema=schema_name)
                        except:
                            fks = []
                        
                        schemas.append({
                            "schema_name": schema_name,
                            "table_name": table_name,
                            "columns": columns,
                            "relationships": fks
                        })
                    except Exception as e:
                        print(f"Skipping table {table_name}: {e}")
                        continue
                        
            return schemas
        except Exception as e:
            print(f"Extraction error: {e}")
            return []

    @staticmethod
    def profile_data(connection_url: str, schema_name: str, table_name: str) -> Dict[str, Any]:
        try:
            engine = create_engine(connection_url)
            query = text(f'SELECT * FROM "{schema_name}"."{table_name}" LIMIT 1000')
            if "mysql" in connection_url:
                 query = text(f'SELECT * FROM {schema_name}.{table_name} LIMIT 1000')

            with engine.connect() as conn:
                df = pd.read_sql(query, conn)
            
            profile = {}
            for col in df.columns:
                series = df[col]
                # Basic stats
                stats = {
                    "null_rate": float(series.isnull().mean()),
                    "distinct_count": int(series.nunique()),
                    "type": str(series.dtype),
                }
                
                if pd.api.types.is_numeric_dtype(series):
                    stats.update({
                        "mean": float(series.mean()) if not series.isnull().all() else 0,
                        "min": float(series.min()) if not series.isnull().all() else 0,
                        "max": float(series.max()) if not series.isnull().all() else 0,
                    })
                
                profile[col] = stats
            return profile
        except Exception as e:
            print(f"Profiling error {table_name}: {e}")
            return {}
