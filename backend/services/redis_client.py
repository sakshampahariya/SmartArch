import os

import redis.asyncio as aioredis

redis_url = os.getenv("REDIS_URL")
redis_client = aioredis.from_url(redis_url, decode_responses=True) if redis_url else None
