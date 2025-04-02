// Importacions
const fs = require('fs').promises;
const { dir } = require('console');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Constants des de variables d'entorn
const IMAGES_SUBFOLDER = 'imatges/animals';
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif'];
const OLLAMA_URL = process.env.CHAT_API_OLLAMA_URL;
const OLLAMA_MODEL = process.env.CHAT_API_OLLAMA_MODEL_VISION;

const DIRECTORIES_TO_ANALIZE = 1;
const OUTPUT_FILE_NAME = "exercici3_resposta.json"

async function imageToBase64(imagePath) {
    try {
        const data = await fs.readFile(imagePath);
        return Buffer.from(data).toString('base64');
    } catch (error) {
        console.error(`Error al llegir o convertir la imatge ${imagePath}:`, error.message);
        return null;
    }
}

async function queryOllama(base64Image, prompt) {
    const requestBody = {
        model: OLLAMA_MODEL,
        prompt: prompt,
        images: [base64Image],
        stream: false
    };

    try {
        console.log('Enviant petició a Ollama...');
        console.log(`URL: ${OLLAMA_URL}/generate`);
        console.log('Model:', OLLAMA_MODEL);
        
        let response = await axios.post(`${OLLAMA_URL}/generate`, requestBody, { timeout: 1000000 });

        console.log('-----------------------')
        
        console.log("JSON sin parsear:", response.data.response);

        console.log('-----------------------')

        const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);

        console.log(jsonMatch)

        const jsonData = JSON.parse(jsonMatch[0])

        console.log("JSON Parseado correctamente:", jsonData);

        return jsonData;
    } catch (error) {
        console.error('Error detallat en la petició a Ollama:', error);
        throw error;
    }
}

async function getAllImages() {
    const imageList = [];
    const imagesFolderPath = path.join(__dirname, process.env.DATA_PATH, IMAGES_SUBFOLDER);
    try {
        await fs.access(imagesFolderPath);
    } catch (error) {
        throw new Error(`El directori d'imatges no existeix: ${imagesFolderPath}`);
    }
    try {
        const animalDirectories = await fs.readdir(imagesFolderPath);
        directoriesAnalized = 0;

        for (const animalDir of animalDirectories) {

            const animalDirPath = path.join(imagesFolderPath, animalDir);

            try {

                const stats = await fs.stat(animalDirPath);
                

                if (!stats.isDirectory()) {
                    console.log(`S'ignora l'element no directori: ${animalDirPath}`);
                    continue;
                }
            } catch (error) {

                console.error(`Error al obtenir informació del directori: ${animalDirPath}`, error.message);
                continue;
            }

            const imageFiles = await fs.readdir(animalDirPath);

            for (const imageFile of imageFiles) {

                const imagePath = path.join(animalDirPath, imageFile);

                const ext = path.extname(imagePath).toLowerCase();
                
                if (!IMAGE_TYPES.includes(ext)) {
                    console.log(`S'ignora fitxer no vàlid: ${imagePath}`);
                    continue;
                }

                const base64String = await imageToBase64(imagePath);

                if (base64String) {
                    imageList.push({fileName : imageFile, base64String : base64String});
                }
            }
            directoriesAnalized++
            if (directoriesAnalized >= DIRECTORIES_TO_ANALIZE) {
                break;
            }
        }
    } catch (error) {
        console.error('Error durant l\'execució:', error.message);
    }
    return imageList;
}

async function main() {
    if (!process.env.DATA_PATH) {
        throw new Error('La variable d\'entorn DATA_PATH no està definida.');
    }
    if (!OLLAMA_URL) {
        throw new Error('La variable d\'entorn CHAT_API_OLLAMA_URL no està definida.');
    }
    if (!OLLAMA_MODEL) {
        throw new Error('La variable d\'entorn CHAT_API_OLLAMA_MODEL no està definida.');
    }

    const imageList = await getAllImages();
    console.log(`Se analizaran ${imageList.length} imágenes`);
    const result = [];

    const prompt = `Identify the type of animal in the image. Respond **only** with a valid JSON object, following the exact structure below. Do not include explanations, text, or code block delimiters. The response must be **only JSON**.

{
    "nom_comu": "Nom comú de l'animal",
    "nom_cientific": "Nom científic si és conegut",
    "taxonomia": {
        "classe": "Mamífer/Au/Rèptil/Amfibi/Peix",
        "ordre": "Ordre taxonòmic",
        "familia": "Família taxonòmica"
    },
    "habitat": {
        "tipus": "Tipus d'hàbitats",
        "regioGeografica": "Regions on viu",
        "clima": "Tipus de climes"
    },
    "dieta": {
        "tipus": "Carnívor/Herbívor/Omnívor",
        "aliments_principals": "Llista d'aliments"
    },
    "caracteristiques_fisiques": {
        "mida": {
            "altura_mitjana_cm": "Altura mitjana en cm",
            "pes_mitja_kg": "Pes mitjà en kg"
        },
        "colors_predominants": "Colors",
        "trets_distintius": "Característiques especials"
    },
    "estat_conservacio": {
        "classificacio_IUCN": "Estat de conservació segons IUCN",
        "amenaces_principals": "Amenaces principals"
    }
}

**Ensure that the response is valid JSON and contains no additional text, markdown, or formatting.**`;

    for (const image of imageList) {
        try {
            const response = await queryOllama(image.base64String, prompt);
            
            result.push({
                fileName: image.fileName,
                data: response
            });

        } catch (error) {
            console.error(`Error processant imatge ${image.fileName}:`, error);
            continue;
        }
    }

    const outputPath = path.join(__dirname, 'data', OUTPUT_FILE_NAME);

    try {
        console.log("Resultat final:", JSON.stringify(result, null, 2));
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`JSON ${OUTPUT_FILE_NAME} desat correctament`);
    } catch (err) {
        console.error("Error escrivint al fitxer:", err);
    }
}

// Executem la funció principal
main();
