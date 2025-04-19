// routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/CustomerController");
const isAuth = require("../middlewares/is-auth");
const { route } = require("./auth");

// Ruta para el Home del cliente
router.get("/home",isAuth , customerController.getCustomerHome);
router.get("/profile", isAuth, customerController.getProfile);
router.post("/profile", isAuth, customerController.postProfile);

router.get("/merchants/type/:typeId", isAuth, customerController.getMerchantsByType);

router.get("/addresses", isAuth, customerController.getAddresses);

// Crear dirección
router.get("/addresses/create", isAuth, customerController.getCreateAddress);
router.post("/addresses/create", isAuth, customerController.postCreateAddress);

// Editar dirección
router.get("/addresses/edit/:addressId", isAuth, customerController.getEditAddress);
router.post("/addresses/edit", isAuth, customerController.postEditAddress);

// Eliminar dirección (confirmación y acción)
router.get("/addresses/delete/:addressId", isAuth, customerController.getConfirmDeleteAddress);
router.post("/addresses/delete", isAuth, customerController.postDeleteAddress);

// Favoritos
router.get("/favorites", isAuth, customerController.GetFavorites);

router.post("/favorites/:merchantId/add", isAuth, customerController.addFavorite);
router.post("/favorites/:merchantId/remove", isAuth, customerController.removeFavorite);


module.exports = router;
