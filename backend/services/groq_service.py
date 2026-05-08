import os

from groq import Groq

SYSTEM_PROMPT = (
    "You are an expert software architect reviewing a system design whiteboard. "
    "Respond with: bottlenecks, recommendations, tech stack, scalability. "
    "Be concise, technical, and actionable. Use bullet points."
)


async def get_architecture_suggestion(prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return completion.choices[0].message.content or ""
