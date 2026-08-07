const { createWorker } = require("tesseract.js");

let workerPromise = null;

async function getWorker() {
    if (!workerPromise) {
        workerPromise = createWorker([
            "eng",
            "tur"
        ]);
    }

    return workerPromise;
}

async function recognizeDocumentText(filePath) {
    const worker = await getWorker();
    const result = await worker.recognize(filePath);

    return result?.data?.text || "";
}

module.exports = {
    recognizeDocumentText
};
