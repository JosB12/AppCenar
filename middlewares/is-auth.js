module.exports = (req, res, next) => {
  // Verifica si la sesión está activa (usuario logueado)
  if (!req.session.isLoggedIn) {
    req.flash("errors", "You are not authorized to access this section");
    return res.redirect("/login");
  }

  if (req.user && !req.user.active) {
    req.flash("errors", "Your account is inactive. Please check your email or contact an administrator.");
    req.session.destroy((err) => {
      if (err) console.log(err);
      return res.redirect("/login");
    });
    return; 
  }

  next();
};
