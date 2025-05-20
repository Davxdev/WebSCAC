import { Request, Response } from 'express';
import { uploadFileAndSendMessage } from '../services/message.service';
import { MessageModel } from '../models/message.model';


export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, recipients } = req.body;
    const file = req.file;

    const result = await uploadFileAndSendMessage(message, recipients, file);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error interno al enviar mensaje' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await MessageModel.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
};

export const getMessagesByRecipient = async (req: Request, res: Response) => {
  try {
    const { recipient } = req.params;
    const messages = await MessageModel.find({ recipients: recipient }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los mensajes del destinatario' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MessageModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Mensaje eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar el mensaje' });
  }
};

export const getUniqueRecipients = async (req: Request, res: Response) => {
  try {
    const messages = await MessageModel.find({}, 'recipients');
    const allRecipients = messages
      .map(msg => msg.recipients.split(',').map(r => r.trim()))
      .flat();
    const uniqueRecipients = [...new Set(allRecipients)];
    res.json(uniqueRecipients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener destinatarios' });
  }
};