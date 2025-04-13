const User = require("../models/User");
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
      if (!user) {
        req.flash("errors", "Invalid email");
        return res.redirect("/login");
      }
  
      // Compara la contraseña ingresada con la almacenada (hasheada)
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        // Si la contraseña es correcta, inicia la sesión
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
            return res.redirect("/"); // fallback en caso de rol desconocido
          }
        });
      }
  
      req.flash("errors", "Invalid password");
      res.redirect("/login");
    } catch (error) {
      console.log(error);
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
  const username = req.body.username; // ¡Extrae el username!
  const role = req.body.role;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  try {
    // Verifica que la contraseña y la confirmación coincidan
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

    // Crea el usuario incluyendo el campo username
    await User.create({
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      email: email,
      username: username, // Aquí se asigna el valor del username
      profilePhoto: req.file ? req.file.path : null, // Si se sube archivo
      password: hashedPassword,
      role: role,
      active: false
    });

    res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("errors", `Signup Error: ${error.message}`);
    res.redirect("/signup");
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
               <p>Click <a href="http://localhost:5000/reset/${token}">here</a> to reset your password</p>`
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
