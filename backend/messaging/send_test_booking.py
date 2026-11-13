import json
import random

import pika

from topology import EXCHANGE_NAME, EXCHANGE_TYPE, BOOKING_CONFIRMED, RABBITMQ_URL

# 1. Connection kholo (phone line)
connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))

# 2. Channel banao (line par baat-cheet)
channel = connection.channel()

# 3. Exchange declare karo (CREATE IF NOT EXISTS jaisa)
#    Settings worker ke declare jaisi honi chahiye, warna error aayegi
channel.exchange_declare(
    exchange=EXCHANGE_NAME,
    exchange_type=EXCHANGE_TYPE,
    durable=True,
)

# 4. Message banao: Python dict → JSON string
booking = {
    "booking_id": random.randint(1000, 9999),
    "user_email": "ravindar@example.com",
    "event": "Coldplay Live",
    "seats": 2,
}
body = json.dumps(booking)

# 5. Publish karo: exchange + routing key + message
channel.basic_publish(
    exchange=EXCHANGE_NAME,
    routing_key=BOOKING_CONFIRMED,
    body=body,
    properties=pika.BasicProperties(
        delivery_mode=2,  # 2 = persistent: RabbitMQ restart par bhi message bachega
        content_type="application/json",
    ),
)

print(f"Sent: {body}")

# 6. Connection band karo
connection.close()
