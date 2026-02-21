from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from app.core.config import settings

class AIService:
    @staticmethod
    def generate_summary(schema_info: dict) -> str:
        prompt = ChatPromptTemplate.from_template("""
        You are a senior data engineer. Generate a business-friendly summary for the following table:
        Table: {table_name}
        Columns: {columns}
        Relationships: {relationships}
        
        Summary should include:
        1. Purpose of the table.
        2. Key business metrics derived.
        3. Usage recommendations.
        """)
        
        # Use OpenAI or Anthropic based on availability
        if settings.OPENAI_API_KEY:
            llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY)
        elif settings.ANTHROPIC_API_KEY:
            llm = ChatAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        else:
            return "AI Summary unavailable (No API Keys provided)."
            
        chain = prompt | llm
        response = chain.invoke(schema_info)
        return response.content

    @staticmethod
    def answer_query(query: str, schema_context: str) -> str:
        prompt = ChatPromptTemplate.from_template("""
        Context: {schema_context}
        Question: {query}
        
        Answer the question based on the database schema provided.
        """)
        
        if settings.OPENAI_API_KEY:
            llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            return "AI Query unavailable."
            
        chain = prompt | llm
        response = chain.invoke({"query": query, "schema_context": schema_context})
        return response.content
