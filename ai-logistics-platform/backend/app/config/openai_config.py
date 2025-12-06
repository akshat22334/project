"""
OpenAI Configuration and Client Management
"""

import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class OpenAIConfig:
    _client: AsyncOpenAI = None
    
    @classmethod
    def get_client(cls) -> AsyncOpenAI:
        """Get or create OpenAI client"""
        if cls._client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            cls._client = AsyncOpenAI(api_key=api_key)
        return cls._client
    
    @classmethod
    def get_model(cls) -> str:
        """Get the default model to use"""
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    @classmethod
    def get_embedding_model(cls) -> str:
        """Get the embedding model to use"""
        return os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

async def get_openai_client() -> AsyncOpenAI:
    """Dependency injection for OpenAI client"""
    return OpenAIConfig.get_client()

async def generate_completion(
    messages: list,
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """Generate completion using OpenAI API"""
    client = OpenAIConfig.get_client()
    model = model or OpenAIConfig.get_model()
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        raise e

async def generate_embedding(text: str) -> list:
    """Generate embedding for text"""
    client = OpenAIConfig.get_client()
    model = OpenAIConfig.get_embedding_model()
    
    try:
        response = await client.embeddings.create(
            model=model,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"OpenAI Embedding Error: {e}")
        raise e

async def analyze_image(image_base64: str, prompt: str) -> str:
    """Analyze image using GPT-4 Vision"""
    client = OpenAIConfig.get_client()
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Vision Error: {e}")
        raise e
