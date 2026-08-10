const express = require("express");

const {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocumentFile,
    extractDocumentDetails
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
router.post(
    "/extract-details",
    extractDocumentDetails
);

router.get("/:id", getDocumentById);
router.get("/:id/file", downloadDocumentFile);

router.patch("/:id", updateDocument);

router.delete("/:id", deleteDocument);

module.exports = router;
