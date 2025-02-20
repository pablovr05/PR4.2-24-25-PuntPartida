const express = require('express');
const router = express.Router();
const { registerPrompt, getConversation, listOllamaModels, analyzeSentiment } = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat/prompt:
 *   post:
 *     summary: Crear un nou prompt o afegir-lo a una conversa existent
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la conversa (opcional)
 *               prompt:
 *                 type: string
 *                 description: Text del prompt
 *               model:
 *                 type: string
 *                 description: Model d'Ollama a utilitzar
 *                 default: llama3.2-vision:latest
 *               stream:
 *                 type: boolean
 *                 description: Indica si la resposta ha de ser en streaming
 *                 default: false
 *     responses:
 *       201:
 *         description: Prompt registrat correctament
 *       400:
 *         description: Dades invàlides
 *       404:
 *         description: Conversa no trobada
 */
router.post('/prompt', registerPrompt);

/**
 * @swagger
 * /api/chat/conversation/{id}:
 *   get:
 *     summary: Obtenir una conversa per ID
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID de la conversa
 *     responses:
 *       200:
 *         description: Conversa trobada
 *       404:
 *         description: Conversa no trobada
 */
router.get('/conversation/:id', getConversation);

/**
 * @swagger
 * /api/chat/models:
 *   get:
 *     summary: Llistar models disponibles a Ollama
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Llista de models disponibles
 *       500:
 *         description: Error al recuperar models
 */
router.get('/models', listOllamaModels);

/**
 * @swagger
 * /api/chat/sentiment-analysis:
 *   post:
 *     summary: Analitzar el sentiment d'una frase donada
 *     tags: [Anàlisi de Sentiment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la conversa (opcional). Si no es proporciona, es crearà una nova conversa.
 *               phrase_to_analyze:
 *                 type: string
 *                 description: La frase que es vol analitzar per al sentiment.
 *               model:
 *                 type: string
 *                 description: Model d'Ollama a utilitzar per analitzar el sentiment.
 *                 default: llama3.2-vision:latest
 *               stream:
 *                 type: boolean
 *                 description: Indica si la resposta s'ha de generar en streaming.
 *                 default: false
 *     responses:
 *       201:
 *         description: Anàlisi de sentiment realitzat correctament.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationId:
 *                   type: string
 *                   format: uuid
 *                   description: ID de la conversa en què s'ha registrat el sentiment.
 *                 promptId:
 *                   type: string
 *                   description: ID del prompt generat per l'anàlisi de sentiment.
 *                 prompt:
 *                   type: string
 *                   description: Frase analitzada pel sistema.
 *                 response:
 *                   type: string
 *                   description: Resposta generada amb l'anàlisi de sentiment (ex. positiu, negatiu, neutre).
 *                 message:
 *                   type: string
 *                   description: Missatge informatiu sobre l'execució de l'anàlisi de sentiment.
 *       400:
 *         description: La frase és obligatòria o hi ha dades invàlides.
 *       404:
 *         description: Conversa no trobada o ID de conversa invàlid.
 */
router.post('/sentiment-analysis', analyzeSentiment);

module.exports = router;
