// routes/admin.js
const express        = require("express");
const router         = express.Router();
const adminController = require("../controllers/AdminController");
const isAuth         = require("../middlewares/is-auth");

// Aplica autenticación a todo /admin
router.use(isAuth);

// Dashboard
router.get("/home", adminController.getDashboard);

// Clientes
router.get("/customers", adminController.getCustomers);
router.post("/customers/:id/activate",   adminController.postActivateCustomer);
router.post("/customers/:id/deactivate", adminController.postDeactivateCustomer);

// Delivery
router.get("/deliveries", adminController.getDeliveries);
router.post("/deliveries/:id/activate",   adminController.postActivateDelivery);
router.post("/deliveries/:id/deactivate", adminController.postDeactivateDelivery);

// Comercios
router.get("/merchants", adminController.getMerchants);
router.post("/merchants/:id/activate",   adminController.postActivateMerchant);
router.post("/merchants/:id/deactivate", adminController.postDeactivateMerchant);

// Configuración
router.get("/configuration",      adminController.getConfiguration);
router.get("/configuration/edit", adminController.getEditConfiguration);
router.post("/configuration",     adminController.postConfiguration);

// Administradores
router.get("/admins",             adminController.getAdmins);
router.get("/admins/new",         adminController.getCreateAdmin);
router.post("/admins",            adminController.postCreateAdmin);
router.get("/admins/:id/edit",    adminController.getEditAdmin);
router.post("/admins/:id",        adminController.postEditAdmin);
router.post("/admins/:id/activate",   adminController.postActivateAdmin);
router.post("/admins/:id/deactivate", adminController.postDeactivateAdmin);

// Tipos de comercio
router.get("/merchant-types",          adminController.getMerchantTypes);
router.get("/merchant-types/new",      adminController.getCreateMerchantType);
router.post("/merchant-types",         adminController.postCreateMerchantType);
router.get("/merchant-types/:id/edit", adminController.getEditMerchantType);
router.post("/merchant-types/:id",     adminController.postEditMerchantType);
router.post("/merchant-types/:id/delete", adminController.postDeleteMerchantType);

module.exports = router;
