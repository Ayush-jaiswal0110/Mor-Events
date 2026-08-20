"""
ai_provider.py — thin provider-agnostic wrapper around whichever AI backend
is configured via environment variables. Called only from
`itinerary_generator.py` — never directly from views/serializers, per the
security requirement of keeping AI keys server-side and behind one seam.

Supported providers (set AI_PROVIDER): "openai", "anthropic", "gemini".
No provider SDK is added as a dependency — everything goes over `requests`,
which this project already depends on, so no new pip installs are required.
"""
import os
import json
import logging

import requests

logger = logging.getLogger(__name__)

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()
AI_MODEL = os.getenv("AI_MODEL", "")
REQUEST_TIMEOUT = (10, 90)


class AIProviderError(Exception):
    """Raised for any provider/network failure. Message is safe to log only —
    callers must not forward `str(exc)` to the client."""


def is_configured() -> bool:
    if AI_PROVIDER == "openai":
        return bool(os.getenv("OPENAI_API_KEY"))
    if AI_PROVIDER == "anthropic":
        return bool(os.getenv("ANTHROPIC_API_KEY"))
    if AI_PROVIDER == "gemini":
        return bool(os.getenv("GEMINI_API_KEY"))
    return False


def generate_json(system_prompt: str, user_prompt: str) -> str:
    """
    Sends the prompt to the configured provider and returns the raw text
    response (expected to be a JSON document). Raises AIProviderError on
    any failure — callers are responsible for validating/parsing the JSON.
    """
    if not is_configured():
        raise AIProviderError(f"AI provider '{AI_PROVIDER}' is not configured (missing API key)")

    try:
        if AI_PROVIDER == "openai":
            return _call_openai(system_prompt, user_prompt)
        if AI_PROVIDER == "anthropic":
            return _call_anthropic(system_prompt, user_prompt)
        if AI_PROVIDER == "gemini":
            return _call_gemini(system_prompt, user_prompt)
        raise AIProviderError(f"Unsupported AI_PROVIDER '{AI_PROVIDER}'")
    except requests.RequestException as exc:
        raise AIProviderError(f"AI provider network error: {exc}") from exc


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    model = AI_MODEL or "gpt-4o-mini"
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
        },
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code >= 400:
        raise AIProviderError(f"OpenAI returned HTTP {resp.status_code}: {resp.text[:300]}")
    payload = resp.json()
    return payload["choices"][0]["message"]["content"]


def _call_anthropic(system_prompt: str, user_prompt: str) -> str:
    model = AI_MODEL or "claude-sonnet-5"
    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": os.getenv("ANTHROPIC_API_KEY"),
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 4096,
            "system": system_prompt + "\nRespond with a single valid JSON object only, no markdown fences.",
            "messages": [{"role": "user", "content": user_prompt}],
        },
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code >= 400:
        raise AIProviderError(f"Anthropic returned HTTP {resp.status_code}: {resp.text[:300]}")
    payload = resp.json()
    parts = payload.get("content", [])
    return "".join(p.get("text", "") for p in parts if p.get("type") == "text")


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    model = AI_MODEL or "gemini-2.0-flash"
    api_key = os.getenv("GEMINI_API_KEY")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/"
        f"models/{model}:generateContent"
    )

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }

    logger.info(
        "Calling Gemini model=%s prompt_chars=%d",
        model,
        len(user_prompt),
    )

    resp = requests.post(
        url,
        params={"key": api_key},
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=(10, 90),
    )

    logger.info(
        "Gemini response status=%s",
        resp.status_code,
    )

    if resp.status_code >= 400:
        raise AIProviderError(
            f"Gemini returned HTTP {resp.status_code}: {resp.text[:500]}"
        )

    payload = resp.json()

    candidates = payload.get("candidates", [])

    if not candidates:
        raise AIProviderError("Gemini returned no candidates")

    parts = candidates[0].get("content", {}).get("parts", [])

    return "".join(
        p.get("text", "")
        for p in parts
        if p.get("text")
    )