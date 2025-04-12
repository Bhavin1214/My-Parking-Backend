const express = require("express");
const router = express.Router();
const { getTransactionsByUser } = require("../controllers/transactioncontroller");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/user", authMiddleware, getTransactionsByUser);

module.exports = router;
