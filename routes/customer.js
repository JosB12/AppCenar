// routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/CustomerController");
const isAuth = require("../middlewares/is-auth");

// Ruta para el Home del cliente
router.get("/home",isAuth , customerController.GetHome);

module.exports = router;
