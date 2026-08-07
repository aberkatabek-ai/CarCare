const express = require("express");

const {
    getIssues,
    getIssueById,
    createIssue,
    addDiagnosis,
    markIssueRepaired,
    deleteIssue,
    downloadIssueMedia
} = require(
    "../controllers/issueController"
);

const {
    requireAuth
} = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

router.use(requireAuth);

router.get("/", getIssues);
router.post("/", createIssue);
router.get(
    "/media/:mediaId/file",
    downloadIssueMedia
);

router.patch(
    "/:id/diagnosis",
    addDiagnosis
);

router.patch(
    "/:id/repair",
    markIssueRepaired
);

router.get("/:id", getIssueById);
router.delete("/:id", deleteIssue);

module.exports = router;
