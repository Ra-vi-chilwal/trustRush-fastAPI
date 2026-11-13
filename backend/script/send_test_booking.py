import asyncio
import json

import aio_pika

RABBITMQ_URL = "amqp://guest:guest@localhost:5672/"
EXCHANGE_NAME = "ticketrush.events"


async def main():
    # 1. Phone milao (connection)
    connection = await aio_pika.connect_robust(RABBITMQ_URL)

    async with connection:
        # 2. Counter kholo (channel)
        channel = await connection.channel()

        # 3. Watchman hai, yeh pakka karo (exchange declare)
        exchange = await channel.declare_exchange(
            EXCHANGE_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )

        # 4. Parcel pack karo (message)
        data = {"booking_id": 101, "seat_no": "A12", "user_email": "ravi@test.com"}
        message = aio_pika.Message(
            body=json.dumps(data).encode(),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )

        # 5. Label lagao aur watchman ko do (publish)
        await exchange.publish(message, routing_key="booking.confirmed")
        print("Message sent:", data)

    # 6. "async with" khatam, toh connection apne aap band


if __name__ == "__main__":
    asyncio.run(main())
