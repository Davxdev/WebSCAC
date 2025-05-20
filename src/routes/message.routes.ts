import { Router } from 'express';
import { sendMessage, getMessages, getMessagesByRecipient, deleteMessage, getUniqueRecipients } from '../controllers/message.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), sendMessage);

// Listar todos los mensajes
router.get('/', getMessages);

// Listar mensajes por destinatario
router.get('/recipient/:recipient', getMessagesByRecipient);

// Nuevo endpoint para eliminar mensaje por ID
router.delete('/:id', deleteMessage);

// Nuevo endpoint para obtener los destinatarios únicos
router.get('/recipients', getUniqueRecipients);

export default router;
