const User = require("../models/User");
const MerchantType = require("../models/MerchantType");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const transporter = require("../services/EmailService");

// Muestra la pantalla de Login
exports.GetLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    loginCSS: true,
    loginActive: true,
  });
};

// Procesa el login
exports.PostLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    // Busca al usuario por email
    const user = await User.findOne({ where: { email: email } });
    console.log("User found:", user);
    if (!user) {
      req.flash("errors", "Invalid email");
      return res.redirect("/login");
    }
    
    // Verificar si el usuario está activo
    if (!user.active) {
      req.flash("errors", "Your account is inactive. Please check your email or contact an administrator.");
      return res.redirect("/login");
    }

    // Compara la contraseña ingresada con la almacenada (hasheada)
    const result = await bcrypt.compare(password, user.password);
    console.log("Password comparison result:", result);
    if (result) {
      console.log("User role:", user.role);
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save((err) => {
        if (err) console.log(err);
        // Redirige según el rol del usuario
        if (user.role === "customer") {
          return res.redirect("/customer/home");
        } else if (user.role === "delivery") {
          return res.redirect("/delivery/home");
        } else if (user.role === "merchant") {
          return res.redirect("/merchant/home");
        } else if (user.role === "admin") {
          return res.redirect("/admin/home");
        } else {
          return res.redirect("/");
        }
      });
    }

    req.flash("errors", "Invalid password");
    console.log("Password is invalid for user:", user.username);
    res.redirect("/login");
  } catch (error) {
    console.log("Error in PostLogin:", error);
    req.flash("errors", "An error occurred. Contact the administrator.");
    res.redirect("/login");
  }
};
  

// Cierra la sesión del usuario
exports.Logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
};

// Muestra la pantalla de registro (Signup) para clientes/delivery
exports.GetSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    signupActive: true,
  });
};

exports.PostSignup = async (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const phone = req.body.phone;
  const email = req.body.email;
  const username = req.body.username;
  const role = req.body.role;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  try {
    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/signup");
    }

    // Verifica si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      req.flash("errors", "Email already exists, please choose a different one");
      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Genera un token de activación
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Crea el usuario, que se creará inactivo, y guarda el activationToken
    const newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      email: email,
      username: username,
      profilePhoto: req.file ? req.file.path : null,
      password: hashedPassword,
      role: role,
      active: false,
      activationToken: activationToken,
    });

    // Construye el enlace de activación. Asegúrate de que la URL y el puerto sean correctos.
    const activationLink = `http://localhost:1200/activate/${activationToken}`;

    // Envía el correo con el enlace de activación
    transporter.sendMail({
      from: "blancojosue931@gmail.com", // Cambia por el correo configurado
      to: email,
      subject: "Account Activation",
      html: `<h3>Your account was created!</h3>
             <p>Click <a href="${activationLink}">here</a> to activate your account.</p>`,
    });

    req.flash("success", "Signup successful! Please check your email to activate your account.");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("errors", `Signup Error: ${error.message}`);
    res.redirect("/signup");
  }
};

exports.GetMerchantSignup = async (req, res, next) => {
  try {
    // Se obtienen los tipos de comercio para llenar el select del formulario
    const merchantTypes = await MerchantType.findAll();
    res.render("auth/signupAsMerchant", {
      pageTitle: "Merchant Signup",
      merchantSignupActive: true,
      merchantTypes: merchantTypes
    });
  } catch (error) {
    console.log(error);
    req.flash("errors", "Error loading merchant types");
    res.redirect("/signup");
  }
};

// Procesa el registro de un merchant
exports.PostMerchantSignup = async (req, res, next) => 
  {
  const merchantName = req.body.merchantName; // Nombre del comercio
  const phone = req.body.phone;
  const email = req.body.email;
  const username = req.body.username;
  const merchantLogo = req.file ? req.file.path : null; // Input file: name="merchantLogo"
  const openingTime = req.body.openingTime; // Debe venir en formato adecuado, ej. "08:00"
  const closingTime = req.body.closingTime; // Ej. "20:00"
  const merchantTypeId = req.body.merchantTypeId; // Valor seleccionado del select
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  try {
    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/signupAsMerchant");
    }

    // Verifica si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      req.flash("errors", "Email already exists, please choose a different one");
      return res.redirect("/signup/merchant");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // Genera un token de activación
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Crea el usuario con rol "merchant", que se creará inactivo para activarse luego
    await User.create({
      merchantName: merchantName,
      phone: phone,
      email: email,
      // Si deseas un campo username distinto, asegúrate de capturarlo también;
      // aquí por defecto se puede usar el email o un campo adicional en el formulario.
      username: email,
      profilePhoto: merchantLogo,
      password: hashedPassword,
      role: "merchant",
      active: false,
      activationToken: activationToken,
      openingTime: openingTime,
      closingTime: closingTime,
      merchantTypeId: merchantTypeId
    });

    // Construye el enlace de activación (usa el puerto correcto)
    const activationLink = `http://localhost:1200/activate/${activationToken}`;

    // Envía el correo con el enlace de activación
    transporter.sendMail({
      from: "blancojosue931@example.com", // Cambia por tu email configurado
      to: email,
      subject: "Account Activation",
      html: `<h3>Your merchant account was created!</h3>
             <p>Click <a href="${activationLink}">here</a> to activate your account.</p>`
    });

    req.flash("success", "Signup successful! Please check your email to activate your account.");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("errors", `Merchant Signup Error: ${error.message}`);
    res.redirect("/signupAsMerchant");
  }
};


exports.GetActivate = async (req, res, next) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({ where: { activationToken: token } });
    if (!user) {
      req.flash("errors", "Invalid activation token");
      return res.redirect("/login");
    }
    // Actualiza el usuario: activa la cuenta y limpia el token
    user.active = true;
    user.activationToken = null;
    await user.save();

    // Renderiza la vista de activación exitosa
    res.render("auth/activate", {
      pageTitle: "Account Activated"
    });
  } catch (error) {
    console.log(error);
    req.flash("errors", "An error occurred during account activation");
    res.redirect("/login");
  }
};


// Muestra la página para solicitar el reseteo de contraseña
exports.GetReset = (req, res, next) => {
  res.render("auth/reset", {
    pageTitle: "Reset",
    loginCSS: true,
    loginActive: true,
  });
};

// Procesa la solicitud de resetear contraseña
exports.PostReset = async (req, res, next) => {
  const email = req.body.email;

  try {
    // Genera un token seguro de 32 bytes
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.log(err);
        return res.redirect("/reset");
      }
      const token = buffer.toString("hex");

      // Busca el usuario por email
      const user = await User.findOne({ where: { email: email } });
      if (!user) {
        req.flash("errors", "No account found with that email");
        return res.redirect("/reset");
      }

      // Asigna el token y su expiración (1 hora)
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000; // 1 hora en milisegundos
      await user.save();

      // Envía el correo con el enlace para resetear la contraseña
      transporter.sendMail({
        from: "blancojosue931@example.com", // Asegúrate de configurar este valor
        to: email,
        subject: "Password Reset",
        html: `<h3>You requested a password reset</h3>
               <p>Click <a href="http://localhost:1200/reset/${token}">here</a> to reset your password</p>`
      });
      res.redirect("/login");
    });
  } catch (error) {
    console.log(error);
    req.flash("errors", "An error occurred. Please try again later.");
    res.redirect("/reset");
  }
};

// Muestra la página para ingresar nueva contraseña tras solicitar reset
exports.GetNewPassword = async (req, res, next) => {
  const token = req.params.token;
  try {
    // Busca el usuario cuyo token sea válido y no haya expirado
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [Op.gte]: Date.now() }
      }
    });
    if (!user) {
      req.flash("errors", "Invalid or expired token");
      return res.redirect("/reset");
    }
    res.render("auth/new-password", {
      pageTitle: "Reset Password",
      loginCSS: true,
      loginActive: true,
      passwordToken: token,
      userId: user.id
    });
  } catch (error) {
    console.log(error);
    req.flash("errors", "An error occurred");
    res.redirect("/reset");
  }
};

// Procesa el formulario para cambiar la contraseña
exports.PostNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  try {
    // Verifica que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/login");
    }
    // Busca el usuario que coincida con el token, el ID y cuyo token aún sea válido
    const user = await User.findOne({
      where: {
        resetToken: passwordToken,
        id: userId,
        resetTokenExpiration: { [Op.gte]: Date.now() }
      }
    });

    if (!user) {
      req.flash("errors", "Invalid token or user");
      return res.redirect("/reset");
    }

    // Hashea la nueva contraseña y actualiza el usuario
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("errors", "An error occurred. Please try again.");
    res.redirect("/reset");
  }
};
