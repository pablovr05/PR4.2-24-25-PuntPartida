const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Constants
const DATA_SUBFOLDER = 'steamreviews';
const CSV_GAMES_FILE_NAME = 'games.csv';
const CSV_REVIEWS_FILE_NAME = 'reviews.csv';

// Funció per llegir el CSV de forma asíncrona
async function readCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Funció per analitzar el sentiment de les ressenyes
async function analyzeSentiment(text) {
    try {
        const response = await fetch(`${process.env.CHAT_API_OLLAMA_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.CHAT_API_OLLAMA_MODEL_TEXT,
                prompt: `Analyze the sentiment of this text and respond with only one word (positive/negative/neutral): "${text}"`,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data || !data.response) {
            throw new Error('La resposta d\'Ollama no té el format esperat');
        }

        return data.response.trim().toLowerCase();
    } catch (error) {
        console.error('Error en la petició a Ollama:', error);
        return 'error';
    }
}

async function main() {
    try {
        const dataPath = process.env.DATA_PATH;

        if (!dataPath) {
            throw new Error('La variable d\'entorn DATA_PATH no està definida');
        }
        if (!process.env.CHAT_API_OLLAMA_URL) {
            throw new Error('La variable d\'entorn CHAT_API_OLLAMA_URL no està definida');
        }
        if (!process.env.CHAT_API_OLLAMA_MODEL_TEXT) {
            throw new Error('La variable d\'entorn CHAT_API_OLLAMA_MODEL_TEXT no està definida');
        }

        const gamesFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_GAMES_FILE_NAME);
        const reviewsFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_REVIEWS_FILE_NAME);

        if (!fs.existsSync(gamesFilePath) || !fs.existsSync(reviewsFilePath)) {
            throw new Error('Algun dels fitxers CSV no existeix');
        }

        const games = await readCSV(gamesFilePath);
        const reviews = await readCSV(reviewsFilePath);

        const gameStatistics = [];

        for (const game of games.slice(0, 2)) {
            const gameId = game.appid;
            const gameName = game.name;
            console.log(`Processant joc: ${gameName}`);

            const gameReviews = reviews.filter(review => review.app_id == gameId).slice(0, 2);

            const statistics = {
                positive: 0,
                negative: 0,
                neutral: 0,
                error: 0
            };


            //Això analitza el sentiment de les opinions de la gent [ Pablo ]
            for (const review of gameReviews) {
                const sentiment = await analyzeSentiment(review.content);
                if (sentiment === 'positive') {
                    statistics.positive++;
                } else if (sentiment === 'negative') {
                    statistics.negative++;
                } else if (sentiment === 'neutral') {
                    statistics.neutral++;
                } else {
                    statistics.error++;
                }
            }

            gameStatistics.push({
                appid: gameId,
                name: gameName,
                statistics: statistics
            });
        }

        const result = {
            timestamp: new Date().toISOString(),
            games: gameStatistics
        };

        const outputDir = path.join(__dirname, 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFilePath = path.join(outputDir, 'exercici2_resposta.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

        console.log('Resultat guardat en:', outputFilePath);
    } catch (error) {
        console.error('Error durant l\'execució:', error.message);
    }
}

// Executem la funció principal
main();
