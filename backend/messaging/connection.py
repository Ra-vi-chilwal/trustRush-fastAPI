import logging

import aio_pika

from config import settings

logger = logging.getLogger("uvicorn.error")

_connection = None
_channel = None


async def connect_rabbitmq():
    global _connection, _channel  # upar wale variables ko badalna hai
    _connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    _channel = await _connection.channel()
    logger.info("connected to RabbitMQ")


async def close_rabbitmq():
    if _connection is not None:
        await _connection.close()
        logger.info("RabbitMQ connection closed")


def get_channel():
    if _channel is None:
        raise RuntimeError("RabbitMQ connected nahi hai")
    return _channel
