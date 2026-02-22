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
                            # Ensure schema_name is in the relationship for lineage accuracy
                            for fk in fks:
                                if not fk.get('referred_schema'):
                                    fk['referred_schema'] = schema_name
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
            query = text(f'SELECT * FROM "{schema_name}"."{table_name}" LIMIT 5000') # Increased sample
            if "mysql" in connection_url:
                 query = text(f'SELECT * FROM {schema_name}.{table_name} LIMIT 5000')

            with engine.connect() as conn:
                df = pd.read_sql(query, conn)
            
            if df.empty:
                return {"_status": "empty"}

            profile = {}
            for col in df.columns:
                series = df[col]
                # Core Quality Metrics
                stats = {
                    "completeness": float(1.0 - series.isnull().mean()),
                    "uniqueness_rate": float(series.nunique() / len(series)) if len(series) > 0 else 0,
                    "distinct_count": int(series.nunique()),
                    "type": str(series.dtype),
                }
                
                # Freshness Detection (Time-based)
                if pd.api.types.is_datetime64_any_dtype(series) or "date" in col.lower() or "time" in col.lower() or "created" in col.lower():
                    try:
                        ts_series = pd.to_datetime(series, errors='coerce').dropna()
                        if not ts_series.empty:
                            stats["max_timestamp"] = ts_series.max().isoformat()
                            stats["min_timestamp"] = ts_series.min().isoformat()
                            # Days since last update
                            days_diff = (pd.Timestamp.now() - ts_series.max()).days
                            stats["freshness_days"] = int(days_diff)
                    except:
                        pass

                # Statistical Analysis for Numerics
                if pd.api.types.is_numeric_dtype(series):
                    desc = series.describe()
                    stats.update({
                        "mean": float(desc['mean']) if not pd.isna(desc['mean']) else None,
                        "std": float(desc['std']) if not pd.isna(desc['std']) else None,
                        "min": float(desc['min']) if not pd.isna(desc['min']) else None,
                        "p25": float(desc['25%']) if not pd.isna(desc['25%']) else None,
                        "p50": float(desc['50%']) if not pd.isna(desc['50%']) else None,
                        "p75": float(desc['75%']) if not pd.isna(desc['75%']) else None,
                        "max": float(desc['max']) if not pd.isna(desc['max']) else None,
                    })
                else:
                    # Top values for Categorical
                    top_vals = series.value_counts().head(5).to_dict()
                    stats["top_values"] = {str(k): int(v) for k, v in top_vals.items()}
                
                profile[col] = stats
            return profile
        except Exception as e:
            print(f"Profiling error {table_name}: {e}")
            return {}
