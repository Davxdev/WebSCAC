// filepath: c:\Users\ASUS\Desktop\WebSCAC\src\services\message.service.ts
import { MessageModel } from '../models/message.model';
import amqplib from 'amqplib';
import { Dropbox } from 'dropbox';
import fs from 'fs';
import fetch from 'node-fetch';


export const uploadFileAndSendMessage = async (
  message: string,
  recipients: string,
  file?: Express.Multer.File
) => {
  let fileUrl = '';

  try {
    // Subir archivo a Dropbox si existe
    if (file) {
      const dbx = new Dropbox({
        accessToken: process.env.DROPBOX_ACCESS_TOKEN,
        fetch: (...args) => fetch(...args)
      });

      const dropboxPath = `/chat-files/${Date.now()}_${file.originalname}`;
      const content = fs.readFileSync(file.path);
      await dbx.filesUpload({ path: dropboxPath, contents: content });

      const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: dropboxPath });
      fileUrl = shared.result.url.replace('?dl=0', '?raw=1');
    }


    // Crear mensaje en la base de datos
    const newMessage = await MessageModel.create({
      message,
      recipients,
      fileUrl,
      status: 'pending',
    });

    // Enviar mensaje a RabbitMQ
    const conn = await amqplib.connect(process.env.RABBITMQ_URL!);
    const channel = await conn.createChannel();
    const queue = 'message_notifications';

    await channel.assertQueue(queue, { durable: true });
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(newMessage)));

    // Cerrar canal y conexión de RabbitMQ
    await channel.close();
    await conn.close();

    console.log(`Mensaje publicado en RabbitMQ a la cola '${queue}'`);

    return { success: true, message: 'Mensaje enviado', data: newMessage };
  } catch (error: any) {
    console.error('Error en uploadFileAndSendMessage:', error);
    return { success: false, message: 'Error al enviar mensaje', error: error.message || error };
  } finally {
    // Eliminar archivo temporal si existe
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }


};