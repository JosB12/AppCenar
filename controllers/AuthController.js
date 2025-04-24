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
  const {
    firstName,
    lastName,
    phone,
    email,
    username,
    role,
    password,
    confirmPassword,
  } = req.body;

  try {
    // 1. Validaciones básicas
    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/signup");
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("errors", "Email already exists, please choose a different one");
      return res.redirect("/signup");
    }

    // 2. Hasheamos la contraseña y generamos token de activación
    const hashedPassword    = await bcrypt.hash(password, 12);
    const activationToken  = crypto.randomBytes(32).toString("hex");

    // 3. Extraemos el fichero "profilePhoto" de req.files
    //    multer().any() almacena TODOS los archivos en req.files
    const profileUpload = (req.files || []).find(
      (f) => f.fieldname === "profilePhoto"
    );
    const profileFile   = profileUpload ? profileUpload.filename : null;
    // 4. Creamos el usuario en la BD
    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email,
      username,
      // ahora sí guardamos el path subido
      profilePhoto: profileFile,
      password: hashedPassword,
      role,
      active: false,
      activationToken,
      availability: role === 'delivery' ? 'disponible' : null
    });

    // 5. Enviamos correo de activación
    const activationLink = `http://localhost:1200/activate/${activationToken}`;
    await transporter.sendMail({
      from: "tu-email@dominio.com",
      to: email,
      subject: "Activate your account",
      html: `
        <h3>¡Bienvenido!</h3>
        <p>Haz click <a href="${activationLink}">aquí</a> para activar tu cuenta.</p>
      `,
    });

    req.flash("success", "Signup successful! Please check your email to activate your account.");
    res.redirect("/login");
  } catch (error) {
    console.error(error);
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
exports.PostMerchantSignup = async (req, res, next) => {
  const {
    merchantName,
    phone,
    email,
    // si tienes un campo username en el formulario:
    openingTime,
    closingTime,
    merchantTypeId,
    password,
    confirmPassword,
  } = req.body;
  const username = req.body.username || email;

  try {
    // 1️⃣ Validación de contraseñas
    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/signupAsMerchant");
    }

    // 2️⃣ Verificar duplicados por email (y opcionalmente por username)
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      req.flash("errors", "Email already exists");
      return res.redirect("/signupAsMerchant");
    }
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      req.flash("errors", "Username already taken");
      return res.redirect("/signupAsMerchant");
    }

    // 3️⃣ Hashear la contraseña y generar token
    const hashedPassword   = await bcrypt.hash(password, 12);
    const activationToken  = crypto.randomBytes(32).toString("hex");

    // 4️⃣ Extraer el fichero merchantLogo de req.files
    const logoFile = (req.files || []).find(f => f.fieldname === "merchantLogo");
    const logoFilename = logoFile ? logoFile.filename : null;

    // 5️⃣ Crear el merchant (activo = false)
    await User.create({
      merchantName,
      phone,
      email,
      username,
      merchantLogo: logoFilename,
      password: hashedPassword,
      role: "merchant",
      active: false,
      activationToken,
      openingTime,
      closingTime,
      merchantTypeId
    });

    // 6️⃣ Envío de correo de activación
    const activationLink = `http://localhost:1200/activate/${activationToken}`;
    await transporter.sendMail({
      from: "tu-correo@dominio.com",
      to: email,
      subject: "Activate your merchant account",
      html: `
        <h3>¡Tu comercio fue creado!</h3>
        <p>Haz click <a href="${activationLink}">aquí</a> para activar tu cuenta.</p>
      `
    });

    req.flash("success", "Signup successful! Please check your email to activate your account.");
    res.redirect("/login");
  } catch (error) {
    console.error(error);
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
