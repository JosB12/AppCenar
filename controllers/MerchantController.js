// controllers/MerchantController.js

const Order = require("../models/Order");
const Category = require("../models/Category");
const Product = require("../models/Product");

// Muestra la página de Home para merchant (lista los pedidos asignados al merchant)
exports.getHome = async (req, res, next) => {
  try {
    // Busca las órdenes del merchant (filtrando por merchantId) y las ordena de la más reciente a la más antigua.
    const orders = await Order.findAll({
      where: { merchantId: req.user.id },
      order: [["orderDateTime", "DESC"]],
      // Si tienes asociación con OrderProduct, podrías incluirla:
      // include: [{ model: OrderProduct }]
    });

    res.render("merchant/home", {
      pageTitle: "Merchant Home",
      orders: orders,
      homeActive: true,
    });
  } catch (error) {
    console.log("Error en getHome de MerchantController:", error);
    next(error);
  }
};

// Muestra el perfil del merchant para su edición
exports.getProfile = (req, res, next) => {
  res.render("merchant/profile", {
    pageTitle: "Merchant Profile",
    user: req.user, // req.user debe contener los datos del merchant
  });
};

// Procesa la actualización del perfil del merchant
exports.postProfile = async (req, res, next) => {
  const { merchantName, phone, email, openingTime, closingTime } = req.body;
  try {
    // Actualiza los campos del usuario (merchant)
    await req.user.update({
      merchantName: merchantName,
      phone: phone,
      email: email,
      openingTime: openingTime,
      closingTime: closingTime,
    });
    res.redirect("/merchant/profile");
  } catch (error) {
    console.log("Error en postProfile de MerchantController:", error);
    next(error);
  }
};

// Muestra el listado de categorías creadas por el merchant
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { merchantId: req.user.id },
    });
    res.render("merchant/categories", {
      pageTitle: "Category Maintenance",
      categories: categories,
    });
  } catch (error) {
    console.log("Error en getCategories de MerchantController:", error);
    next(error);
  }
};

// Muestra el listado de productos creados por el merchant
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { merchantId: req.user.id },
    });
    res.render("merchant/products", {
      pageTitle: "Product Maintenance",
      products: products,
    });
  } catch (error) {
    console.log("Error en getProducts de MerchantController:", error);
    next(error);
  }
};
