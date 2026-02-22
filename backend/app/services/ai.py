from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.core.config import settings
import json

class AIService:
    _llm_instance = None

    @staticmethod
    def _get_llm(streaming=False):
        if not settings.GOOGLE_API_KEY: return None
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", 
            google_api_key=settings.GOOGLE_API_KEY,
            streaming=streaming,
            temperature=0.1 # Faster, more deterministic
        )

    @staticmethod
    def stream_query(query: str, schema_context: str):
        llm = AIService._get_llm(streaming=True)
        if not llm: yield "Error: No API Key."; return

        prompt = ChatPromptTemplate.from_template("""
        You are an expert Data Engineer and Architect. Use the following schema context to answer the user's question accurately.
        If the question is about data quality, use the provided metrics if available.
        If the user asks for SQL, provide optimized and readable code.
        
        Context: {schema_context}
        Query: {query}
        
        Answer professionally and concisely:
        """)
        chain = prompt | llm
        
        try:
            for chunk in chain.stream({"query": query, "schema_context": schema_context}):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"Error: {str(e)}"

    @staticmethod
    def generate_summary(schema_info: dict, profile_stats: dict = None) -> str:
        llm = AIService._get_llm()
        if not llm: return "AI Summary unavailable."
        
        prompt = ChatPromptTemplate.from_template("""
        Analyze the following database table metadata and profile statistics.
        Generate a business-friendly summary and usage recommendations.
        
        Table: {table_name}
        Columns: {columns}
        Profile Data: {profile_stats}
        
        Format your response as Markdown:
        ### Business Summary
        (A clear explanation of what this table represents in business terms)
        
        ### Usage Recommendations
        (How should data analysts or engineers use this table? Mention any quality caveats based on profile data)
        """)
        
        chain = prompt | llm
        return chain.invoke({
            "table_name": schema_info.get("table_name"),
            "columns": json.dumps(schema_info.get("columns")),
            "profile_stats": json.dumps(profile_stats) if profile_stats else "No profile data available."
        }).content

    @staticmethod
    def answer_query(query: str, schema_context: str) -> str:
        llm = AIService._get_llm()
        if not llm: return "AI Query unavailable."
        prompt = ChatPromptTemplate.from_template("""
        Context: {schema_context}
        Query: {query}
        
        Answer based on the schema context. Be helpful and technical.
        """)
        return (prompt | llm).invoke({"query": query, "schema_context": schema_context}).content

    @staticmethod
    def generate_sql(query: str, schema_context: str) -> str:
        llm = AIService._get_llm()
        if not llm: return "-- SQL unavailable."
        prompt = ChatPromptTemplate.from_template("Context: {schema_context}\nSQL for: {query}\nReturn ONLY code:")
        return (prompt | llm).invoke({"query": query, "schema_context": schema_context}).content
