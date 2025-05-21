// filepath: c:\Users\ASUS\Desktop\WebSCAC\src\services\message.service.ts
import { MessageModel } from '../models/message.model';
import amqplib from 'amqplib';
import { Dropbox } from 'dropbox';
import fs from 'fs';
import fetch from 'node-fetch';
import { io } from '../index';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Función genérica de reintentos
async function retry<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
      }
    }
  }
  throw lastError;
}

export const uploadFileAndSendMessage = async (
  message: string,
  recipients: string,
  file?: Express.Multer.File
) => {
  let fileUrl = '';
  let newMessage: any = null;

  try {
    // Subir archivo a Dropbox con reintentos si existe
    if (file) {
      const dbx = new Dropbox({
        accessToken: process.env.DROPBOX_ACCESS_TOKEN,
        fetch: (...args) => fetch(...args)
      });

      const dropboxPath = `/chat-files/${Date.now()}_${file.originalname}`;
      const content = fs.readFileSync(file.path);

      await retry(async () => {
        await dbx.filesUpload({ path: dropboxPath, contents: content });
      });

      const shared = await retry(async () => {
        return await dbx.sharingCreateSharedLinkWithSettings({ path: dropboxPath });
      });

      fileUrl = shared.result.url.replace('?dl=0', '?raw=1');
    }

    // Crear mensaje en la base de datos con estado 'pending'
    newMessage = await MessageModel.create({
      message,
      recipients,
      fileUrl,
      status: 'pending',
    });

    // Enviar mensaje a RabbitMQ con reintentos
    await retry(async () => {
      const conn = await amqplib.connect(process.env.RABBITMQ_URL!);
      const channel = await conn.createChannel();
      const queue = 'message_notifications';

      await channel.assertQueue(queue, { durable: true });
      await channel.sendToQueue(queue, Buffer.from(JSON.stringify(newMessage)));

      await channel.close();
      await conn.close();
    });

    // Actualizar estado a 'sent'
    newMessage.status = 'sent';
    await newMessage.save();

     // Notificación en tiempo real
    io.emit('new_message', {
      recipients,
      message,
      fileUrl,
      status: 'sent'
    });

    console.log(`Mensaje publicado en RabbitMQ y guardado como 'sent'`);
    return newMessage;
  } catch (error: any) {
    // Si hubo error, actualizar estado a 'failed'
    if (newMessage) {
      newMessage.status = 'failed';
      await newMessage.save();
    }
    console.error('Error en uploadFileAndSendMessage:', error);
    throw error;
  } finally {
    // Eliminar archivo temporal si existe
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};