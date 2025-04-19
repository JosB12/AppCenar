// controllers/DeliveryController.js
const Order        = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");
const Product      = require("../models/Product");
const Address      = require("../models/Address");
const User         = require("../models/User");

exports.getHome = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { deliveryId: req.user.id },
      include: [
        // trae datos del comercio
        { model: User, as: "merchant" },
        // trae productos usando el alias order_products
        {
          model: OrderProduct,
          as: "order_products",
          include: [{ model: Product }]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.render("delivery/home", {
      pageTitle: "Delivery Home",
      orders,
      homeActive: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
        deliveryId: req.user.id
      },
      include: [
        { model: User, as: "merchant" },
        { model: Address },
        {
          model: OrderProduct,
          as: "order_products",
          include: [{ model: Product }]
        }
      ],
    });

    if (!order) {
      return res.redirect("/delivery/home");
    }

    res.render("delivery/order-detail", {
      pageTitle: "Order Detail",
      order,
    });
  } catch (err) {
    next(err);
  }
};

exports.postCompleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
        deliveryId: req.user.id
      },
    });

    if (!order) {
      return res.redirect("/delivery/home");
    }

    // marca el pedido como completado
    order.status = "completed";
    await order.save();

    // opcional: vuelve a poner al delivery disponible
    req.user.available = true;
    await req.user.save();

    res.redirect("/delivery/order/" + req.params.orderId);
  } catch (err) {
    next(err);
  }
};

exports.getProfile = (req, res, next) => {
  res.render("delivery/profile", {
    pageTitle: "Your Profile",
    user: req.user,
  });
};

exports.postProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    req.user.firstName = firstName;
    req.user.lastName  = lastName;
    req.user.phone     = phone;
    if (req.files && req.files.length) {
        // busca en req.files el campo que te interese
        const upload = req.files.find((f) => f.fieldname === "profilePhoto");
        if (upload) {
          req.user.profilePhoto = upload.filename;
        }
      }
    await req.user.save();
    req.flash("success", "Tu perfil se ha actualizado correctamente");
    res.redirect("/delivery/profile");
  } catch (err) {
    next(err);
  }
};
