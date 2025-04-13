module.exports = (req, res, next) => {
  // Verifica si la sesión está activa (usuario logueado)
  if (!req.session.isLoggedIn) {
    req.flash("errors", "You are not authorized to access this section");
    return res.redirect("/login");
  }

  // En este punto, la sesión está iniciada.
  // Verifica si el usuario está activo (esta propiedad debe estar cargada en req.user mediante un middleware anterior)
  if (req.user && !req.user.active) {
    req.flash("errors", "Your account is inactive. Please check your email or contact an administrator.");
    // Opcionalmente, se destruye la sesión para evitar estados inconsistentes
    req.session.destroy((err) => {
      if (err) console.log(err);
      return res.redirect("/login");
    });
    return; // Se detiene la ejecución del middleware
  }

  // Si se pasa la verificación, continúa al siguiente middleware o ruta
  next();
};
