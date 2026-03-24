import logging
from openai import AsyncOpenAI
from ..core.config import settings
from ..models.chat_models import ChatMessage

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Use OpenRouter as default
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
        self.default_model = settings.openrouter_model
        logger.info(f"LLMService initialized with model: {self.default_model}")

    async def generate_response(
        self, 
        user_message: str, 
        history: list[ChatMessage] | None = None,
        model: str | None = None
    ) -> tuple[str, str]:
        """
        Call the LLM and return (response_text, model_used)
        """
        try:
            # Build messages: system prompt + conversation history + new user message
            messages = []
            
            # Add system prompt (you can customize)
            messages.append({
                "role": "system",
                "content": "You are REXION, a helpful and friendly AI assistant."
            })
            
            # Add conversation history (if any)
            if history:
                for msg in history:
                    messages.append({"role": msg.role, "content": msg.content})
            
            # Add the new user message
            messages.append({"role": "user", "content": user_message})
            
            model_to_use = model or self.default_model
            
            # Call OpenRouter
            completion = await self.client.chat.completions.create(
                model=model_to_use,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                # Optional: add extra headers for OpenRouter
                extra_headers={
                    "HTTP-Referer": "https://yourdomain.com",  # Replace with your site
                    "X-Title": "REXION Chat",
                }
            )
            
            reply = completion.choices[0].message.content
            logger.info(f"LLM call successful, model: {model_to_use}")
            return reply, model_to_use
        
        except Exception as e:
            logger.exception("LLM API call failed")
            raise

# Singleton instance
llm_service = LLMService()