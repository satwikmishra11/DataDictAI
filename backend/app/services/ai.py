from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.core.config import settings
import json

class AIService:
    @staticmethod
    def generate_summary(schema_info: dict, profile_stats: dict = None) -> str:
        stats_context = ""
        if profile_stats:
            stats_context = f"\nData Quality Metrics (Null Rates, Uniqueness):\n{json.dumps(profile_stats, indent=2)}"

        prompt = ChatPromptTemplate.from_template("""
        You are a senior data engineer and business analyst. Generate a comprehensive, professional summary for the following database table.
        
        Table Name: {table_name}
        Columns & Types: {columns}
        Relationships: {relationships}
        {stats_context}
        
        Your summary must include:
        1. **Business Purpose**: What real-world entity or process does this table represent?
        2. **Key Metrics**: Potential KPIs derived from this data (e.g., "Monthly Revenue", "Active Users").
        3. **Data Quality Insights**: Comment on the health of the data based on the provided metrics (e.g., "High null rate in 'email' column suggests optional field").
        4. **Usage Recommendations**: How should analysts join or filter this table?
        
        Format as Markdown.
        """)
        
        if settings.GOOGLE_API_KEY:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=settings.GOOGLE_API_KEY)
        else:
            return "AI Summary unavailable (No Gemini API Key provided)."
            
        chain = prompt | llm
        # Extract just the relevant parts for the prompt to avoid token limits if necessary
        # For now, pass the full schema info.
        response = chain.invoke({
            "table_name": schema_info.get("table_name"),
            "columns": schema_info.get("columns"),
            "relationships": schema_info.get("relationships"),
            "stats_context": stats_context
        })
        return response.content

    @staticmethod
    def answer_query(query: str, schema_context: str) -> str:
        prompt = ChatPromptTemplate.from_template("""
        You are a helpful data assistant.
        Context (Database Schema Summaries):
        {schema_context}
        
        User Question: {query}
        
        Answer the question based on the schema. If the user asks for a query, provide a valid SQL query (assume PostgreSQL dialect unless specified).
        """)
        
        if settings.GOOGLE_API_KEY:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=settings.GOOGLE_API_KEY)
        else:
            return "AI Query unavailable."
            
        chain = prompt | llm
        response = chain.invoke({"query": query, "schema_context": schema_context})
        return response.content

    @staticmethod
    def generate_sql(query: str, schema_context: str) -> str:
        prompt = ChatPromptTemplate.from_template("""
        You are an expert SQL developer. Generate a SQL query for the following request.
        
        Schema Context:
        {schema_context}
        
        Request: {query}
        
        Return ONLY the SQL query in a code block. Do not add explanation.
        """)
        
        if settings.GOOGLE_API_KEY:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=settings.GOOGLE_API_KEY)
        else:
            return "-- AI SQL unavailable."
            
        chain = prompt | llm
        response = chain.invoke({"query": query, "schema_context": schema_context})
        return response.content
