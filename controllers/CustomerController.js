// controllers/CustomerController.js

const MerchantType = require("../models/MerchantType");
const Order = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");
const Address = require("../models/Address");
const User = require("../models/User");
const Favorite = require("../models/Favorite");

// Muestra la página de inicio del cliente, listando los tipos de comercio disponibles
exports.GetHome = async (req, res, next) => {
  try {
    // Lista todos los tipos de comercio creados en el sistema
    const merchantTypes = await MerchantType.findAll();
    res.render("customer/home", {
      pageTitle: "Customer Home",
      merchantTypes: merchantTypes,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Muestra el perfil del cliente (datos almacenados en req.user)
exports.GetProfile = async (req, res, next) => {
  try {
    res.render("customer/profile", {
      pageTitle: "My Profile",
      user: req.user, // Asume que el middleware ya carga req.user
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Procesa la actualización del perfil del cliente
exports.PostProfile = async (req, res, next) => {
  const { firstName, lastName, phone, email } = req.body;
  try {
    await User.update(
      { firstName, lastName, phone, email },
      { where: { id: req.user.id } }
    );
    res.redirect("/customer/profile");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Lista las órdenes (orders) realizadas por el cliente, ordenadas de la más reciente a la más antigua
exports.GetOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.user.id },
      order: [["orderDateTime", "DESC"]],
    });
    res.render("customer/orders", {
      pageTitle: "My Orders",
      orders: orders,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Muestra el detalle de una orden específica
exports.GetOrderDetail = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderProduct },
        { model: User, as: "merchant" }
      ],
    });
    if (!order) {
      req.flash("errors", "Order not found");
      return res.redirect("/customer/orders");
    }
    res.render("customer/order-detail", {
      pageTitle: "Order Details",
      order: order,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Lista las direcciones (addresses) registradas por el cliente
exports.GetAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { customerId: req.user.id },
    });
    res.render("customer/addresses", {
      pageTitle: "My Addresses",
      addresses: addresses,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Procesa la creación de una nueva dirección para el cliente
exports.PostAddress = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    await Address.create({
      name: name,
      description: description,
      customerId: req.user.id,
    });
    res.redirect("/customer/addresses");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Lista los merchants marcados como favoritos por el cliente
exports.GetFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { customerId: req.user.id },
      include: [{ model: User, as: "merchant" }],
    });
    res.render("customer/favorites", {
      pageTitle: "My Favorites",
      favorites: favorites,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
