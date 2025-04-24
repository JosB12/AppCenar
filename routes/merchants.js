// routes/merchantRoutes.js
const express = require("express");
const router = express.Router();
const merchantController = require("../controllers/MerchantController");
const isAuth = require("../middlewares/is-auth");

// Ruta para el Home del merchant
router.get("/home", isAuth, merchantController.getHome);
router.get("/orders/:orderId", isAuth, merchantController.getOrderDetail);
router.post("/orders/:orderId/assign", isAuth, merchantController.assignDelivery);



// Ruta para ver el perfil del merchant
router.get("/profile", isAuth, merchantController.getProfile);
router.post("/profile", isAuth, merchantController.postProfile);

// Ruta para el mantenimiento de categorías
router.get("/categories", isAuth, merchantController.getCategories);

// Ruta para el mantenimiento de productos
router.get("/products", isAuth, merchantController.getProducts);


// Crear categoría
router.get("/categories/create", isAuth, merchantController.getCreateCategory);
router.post("/categories/create", isAuth, merchantController.postCreateCategory);

// Editar categoría
router.get("/categories/edit/:categoryId", isAuth, merchantController.getEditCategory);
router.post("/categories/edit", isAuth, merchantController.postEditCategory);

// Eliminar categoría
router.get("/categories/delete/:categoryId", isAuth, merchantController.getConfirmDeleteCategory);
router.post("/categories/delete", isAuth, merchantController.postDeleteCategory);

// Productos
router.get("/products", isAuth, merchantController.getProducts);

// Crear Productos
router.get("/products/create", isAuth, merchantController.getCreateProduct);
router.post("/products/create", isAuth, merchantController.postCreateProduct);

// Editar Productos
router.get("/products/edit/:productId", isAuth, merchantController.getEditProduct);
router.post("/products/edit", isAuth, merchantController.postEditProduct);

// Eliminar Productos
router.get("/products/delete/:productId", isAuth, merchantController.getConfirmDeleteProduct);
router.post("/products/delete", isAuth, merchantController.postDeleteProduct);


module.exports = router;
