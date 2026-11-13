import json

import pika

from topology import (
    EXCHANGE_NAME,
    EXCHANGE_TYPE,
    EMAIL_QUEUE,
    BOOKING_CONFIRMED,
    RABBITMQ_URL,
)


# Callback: RabbitMQ har naye message par ye function chalayega
def on_message(channel, method, properties, body):
    booking = json.loads(body)  # JSON string → Python dict
    print(
        f"📧 Email bhej rahe hain: booking {booking['booking_id']} → {booking['user_email']}"
    )

    # Kaam ho gaya → RabbitMQ ko batao, ab ye message delete kar do
    channel.basic_ack(delivery_tag=method.delivery_tag)


def main():
    # 1. Connection + channel (publisher jaisa)
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()

    # 2. Prefetch: ek baar mein sirf 1 message do, ack ke baad agla
    channel.basic_qos(prefetch_count=1)

    # 3. Exchange declare: bilkul publisher jaisa (type + durable same)
    channel.exchange_declare(
        exchange=EXCHANGE_NAME, exchange_type=EXCHANGE_TYPE, durable=True
    )

    # 4. Apni queue declare karo (durable)
    channel.queue_declare(queue=EMAIL_QUEUE, durable=True)

    # 5. Binding: "booking.confirmed" wale messages meri queue mein bhejo
    channel.queue_bind(
        queue=EMAIL_QUEUE, exchange=EXCHANGE_NAME, routing_key=BOOKING_CONFIRMED
    )

    # 6. Batao ki is queue se message aaye to on_message chalao
    channel.basic_consume(queue=EMAIL_QUEUE, on_message_callback=on_message)

    print("👂 Email worker chalu hai. Band karne ke liye Ctrl+C")
    try:
        channel.start_consuming()  # yahan program rukta hai aur messages ka wait karta hai
    except KeyboardInterrupt:
        channel.stop_consuming()
        connection.close()
        print("Worker band.")


if __name__ == "__main__":
    main()
