// routes/delivery.js
const express           = require("express");
const router            = express.Router();
const deliveryController= require("../controllers/DeliveryController");
const isAuth            = require("../middlewares/is-auth");

// Aplica isAuth a todas las rutas de este router
router.use(isAuth);

router.get("/home",                     deliveryController.getHome);
router.get("/order/:orderId",           deliveryController.getOrderDetail);
router.post("/order/:orderId/complete", deliveryController.postCompleteOrder);
router.get("/profile",                  deliveryController.getProfile);
router.post("/profile",                 deliveryController.postProfile);

module.exports = router;
