"""
LLM Fallback Chain Service
Implements priority-based fallback: Groq → Gemini → HuggingFace
"""
import os
import re
import asyncio
import logging
from typing import Optional
from groq import AsyncGroq
import google.generativeai as genai
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)


def extract_json_from_markdown(text: str) -> str:
    """
    Extract JSON from markdown code blocks if present.
    Handles cases like:
    - ```json\n{...}\n```
    - ```\n{...}\n```
    - Plain JSON: {...}
    - Text before/after JSON
    
    Args:
        text: Raw text that may contain markdown-wrapped JSON
        
    Returns:
        Cleaned JSON string
    """
    # First try: Remove markdown code blocks
    # Pattern: ```json or ``` followed by content and closing ```
    pattern = r'```(?:json)?\s*\n?(.*?)\n?```'
    match = re.search(pattern, text, re.DOTALL)
    
    if match:
        return match.group(1).strip()
    
    # Second try: Find JSON object or array in the text
    # Look for { ... } or [ ... ]
    json_pattern = r'(\{.*\}|\[.*\])'
    json_match = re.search(json_pattern, text, re.DOTALL)
    
    if json_match:
        return json_match.group(1).strip()
    
    # If no patterns found, return original text stripped
    return text.strip()

# Initialize clients lazily to avoid errors if env vars not loaded
_groq_client = None
_hf_client = None
_gemini_configured = False


def _get_groq_client():
    """Lazy initialization of Groq client"""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        _groq_client = AsyncGroq(api_key=api_key)
    return _groq_client


def _get_hf_client():
    """Lazy initialization of HuggingFace client"""
    global _hf_client
    if _hf_client is None:
        token = os.getenv("HF_TOKEN")
        _hf_client = InferenceClient(token=token)
    return _hf_client


def _configure_gemini():
    """Lazy configuration of Gemini"""
    global _gemini_configured
    if not _gemini_configured:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        _gemini_configured = True


async def call_llm(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 2048,
    temperature: float = 0.2,
    timeout: int = 30
) -> tuple[str, str]:
    """
    Tries LLMs in order: Groq → Gemini → HuggingFace
    Returns (response_text, provider_used)
    
    Args:
        system_prompt: System instruction for the LLM
        user_message: User query/content to analyze
        max_tokens: Maximum tokens in response
        temperature: Sampling temperature (0.0-1.0)
        timeout: Timeout in seconds per provider
        
    Returns:
        Tuple of (response_text, provider_name)
        
    Raises:
        RuntimeError: If all providers fail
    """
    providers = [
        ("Groq", _call_groq),
        ("Gemini", _call_gemini),
        ("HuggingFace", _call_huggingface),
    ]
    
    last_error = None
    
    for provider_name, provider_func in providers:
        try:
            logger.info(f"Attempting LLM call with {provider_name}")
            result = await asyncio.wait_for(
                provider_func(system_prompt, user_message, max_tokens, temperature),
                timeout=timeout
            )
            if result:
                logger.info(f"Successfully got response from {provider_name}")
                # Clean markdown code blocks from response
                cleaned_result = extract_json_from_markdown(result)
                return cleaned_result, provider_name
        except asyncio.TimeoutError:
            last_error = f"{provider_name} timeout after {timeout}s"
            logger.warning(last_error)
            continue
        except Exception as e:
            last_error = f"{provider_name} error: {str(e)}"
            logger.warning(last_error)
            continue

    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")


async def _call_groq(
    system_prompt: str,
    user_message: str,
    max_tokens: int,
    temperature: float
) -> str:
    """Call Groq's LLaMA 3.3 70B model"""
    client = _get_groq_client()
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content


async def _call_gemini(
    system_prompt: str,
    user_message: str,
    max_tokens: int,
    temperature: float
) -> str:
    """Call Google Gemini 1.5 Flash"""
    _configure_gemini()
    model = genai.GenerativeModel(
        "gemini-flash-latest",
        system_instruction=system_prompt,
        generation_config={
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        }
    )
    response = await model.generate_content_async(user_message)
    return response.text


async def _call_huggingface(
    system_prompt: str,
    user_message: str,
    max_tokens: int,
    temperature: float
) -> str:
    """Call HuggingFace Mistral 7B Instruct"""
    client = _get_hf_client()
    prompt = f"[INST] {system_prompt}\n\n{user_message} [/INST]"
    response = client.text_generation(
        prompt,
        model="mistralai/Mistral-7B-Instruct-v0.3",
        max_new_tokens=max_tokens,
        temperature=temperature,
    )
    return response


async def call_vision_llm(
    system_prompt: str,
    image_data: bytes,
    mime_type: str = "image/jpeg",
    max_tokens: int = 2048
) -> tuple[str, str]:
    """
    Call vision-capable LLM (Gemini 1.5 Flash)
    
    Args:
        system_prompt: Instructions for image analysis
        image_data: Raw image bytes
        mime_type: Image MIME type
        max_tokens: Maximum response tokens
        
    Returns:
        Tuple of (response_text, provider_name)
    """
    try:
        import base64
        logger.info("Calling Gemini Vision API")
        
        _configure_gemini()
        b64_image = base64.b64encode(image_data).decode()
        
        model = genai.GenerativeModel("gemini-flash-latest")
        response = await model.generate_content_async([
            system_prompt,
            {"mime_type": mime_type, "data": b64_image}
        ])
        
        logger.info("Successfully got response from Gemini Vision")
        cleaned_result = extract_json_from_markdown(response.text)
        return cleaned_result, "Gemini Vision"
        
    except Exception as e:
        logger.error(f"Vision LLM failed: {str(e)}")
        raise RuntimeError(f"Vision analysis failed: {str(e)}")
