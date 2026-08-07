const express = require("express");

const {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocumentFile
} = require(
    "../controllers/documentController"
);

const {
    requireAuth
} = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

router.use(requireAuth);

router.get("/", getDocuments);

router.post("/", createDocument);

router.get("/:id", getDocumentById);
router.get("/:id/file", downloadDocumentFile);

router.patch("/:id", updateDocument);

router.delete("/:id", deleteDocument);

module.exports = router;
