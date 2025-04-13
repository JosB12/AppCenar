const express = require("express");
const authController = require("../controllers/AuthController");

const router = express.Router();

//#region login - logout
// Ruta para mostrar la página de login
router.get("/login", authController.GetLogin);
// Ruta para procesar el formulario de login
router.post("/login", authController.PostLogin);
// Ruta para cerrar sesión
router.post("/logout", authController.Logout);
//#endregion


//#region signup

// Ruta para mostrar la página de registro (Signup)
router.get("/signup", authController.GetSignup);
// Ruta para procesar el registro (Signup)
router.post("/signup", authController.PostSignup);

//#endregion

//#region reset password
// Ruta para mostrar la página de reset de contraseña
router.get("/reset", authController.GetReset);
// Ruta para procesar la solicitud de reset de contraseña y enviar el token por email
router.post("/reset", authController.PostReset);

// Ruta para mostrar la página en la que se introduce la nueva contraseña usando el token enviado
router.get("/reset/:token", authController.GetNewPassword);
// Ruta para procesar el formulario de nueva contraseña
router.post("/new-password", authController.PostNewPassword);

//#endregion

module.exports = router;
