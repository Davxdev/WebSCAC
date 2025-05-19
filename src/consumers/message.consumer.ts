import amqplib from 'amqplib';

export const startMessageConsumer = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL!);
    const channel = await conn.createChannel();
    const queue = 'message_notifications';

    await channel.assertQueue(queue, { durable: true });

    console.log(`🎧 Escuchando la cola '${queue}'...`);

    channel.consume(queue, (msg) => {
      if (msg) {
        const content = msg.content.toString();
        const message = JSON.parse(content);

        // 🔔 Aquí simulas una notificación
        console.log(`📨 Mensaje recibido para notificación:\n`, message);

        // Confirmar procesamiento
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('❌ Error en el consumidor de mensajes:', error);
  }
};
