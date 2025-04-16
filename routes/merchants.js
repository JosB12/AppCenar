// routes/merchantRoutes.js

const express = require("express");
const router = express.Router();
const merchantController = require("../controllers/MerchantController");
const isAuth = require("../middlewares/is-auth");

// Ruta para el Home del merchant
router.get("/home", isAuth, merchantController.getHome);

// Ruta para ver el perfil del merchant
router.get("/profile", isAuth, merchantController.getProfile);
router.post("/profile", isAuth, merchantController.postProfile);

// Ruta para el mantenimiento de categorías
router.get("/categories", isAuth, merchantController.getCategories);

// Ruta para el mantenimiento de productos
router.get("/products", isAuth, merchantController.getProducts);

module.exports = router;
