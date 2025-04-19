// controllers/CustomerController.js
const MerchantType = require("../models/MerchantType");
const Order = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");
const Address = require("../models/Address");
const User = require("../models/User");
const Favorite = require("../models/Favorite");
const { Op } = require("sequelize");




//#region Home del cliente
// Muestra todos los tipos de comercios en el home del cliente
exports.getCustomerHome = async (req, res, next) => {
  try {
    const merchantTypes = await MerchantType.findAll();
    res.render("customer/home", {
      pageTitle: "Home",
      merchantTypes
    });
  } catch (error) {
    console.log("Error en getCustomerHome:", error);
    next(error);
  }
};

// Muestra todos los comercios filtrados por tipo
exports.getMerchantsByType = async (req, res, next) => {
  const typeId = req.params.typeId;
  const searchTerm = req.query.search || "";

  try {
    // Buscar comercios activos por tipo y filtro de nombre
    const merchants = await User.findAll({
      where: {
        role: "merchant",
        merchantTypeId: typeId,
        active: true,
        merchantName: {
          [Op.like]: `%${searchTerm}%`
        }
      }
    });

    // Buscar favoritos del usuario actual
    const favorites = await Favorite.findAll({
      where: { customerId: req.user.id },
      attributes: ["merchantId"]
    });

    const favoriteIds = favorites.map(fav => fav.merchantId);

    // Agregar isFavorite a cada merchant
    const merchantsWithFlags = merchants.map(m => ({
      ...m.toJSON(),
      isFavorite: favoriteIds.includes(m.id)
    }));

    res.render("customer/merchants-by-type", {
      pageTitle: "Comercios",
      merchants: merchantsWithFlags,
      csrfToken: req.csrfToken(),
      searchTerm
    });
  } catch (error) {
    console.log("Error en getMerchantsByType:", error);
    next(error);
  }
};
//#endregion

//#region Perfil cliente
// GET: Mostrar perfil del cliente
exports.getProfile = (req, res, next) => {
  res.render("customer/profile", {
    pageTitle: "Mi Perfil",
    user: req.user
  });
};

// POST: Actualizar perfil del cliente
exports.postProfile = async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  try {
    const updates = {
      firstName,
      lastName,
      phone
    };

    // Buscar archivo en req.files (porque se usa .any() en multer)
    const photoFile = req.files?.find(file => file.fieldname === "profilePhoto");
    if (photoFile) {
      updates.profilePhoto = photoFile.filename;
    }

    await req.user.update(updates);
    res.redirect("/customer/profile");
  } catch (error) {
    console.error("Error en postProfile de cliente:", error);
    next(error);
  }
};

//#endregion


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

//#region Direcciones
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { customerId: req.user.id }
    });

    res.render("customer/addresses", {
      pageTitle: "Mis direcciones",
      addresses
    });
  } catch (error) {
    console.log("Error en getAddresses:", error);
    next(error);
  }
};

// Mostrar formulario para crear dirección
exports.getCreateAddress = (req, res) => {
  res.render("customer/addresses-create", {
    pageTitle: "Agregar dirección",
    csrfToken: req.csrfToken()
  });
};

// Guardar nueva dirección
exports.postCreateAddress = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    await Address.create({
      name,
      description,
      customerId: req.user.id
    });

    res.redirect("/customer/addresses");
  } catch (error) {
    console.log("Error al crear dirección:", error);
    next(error);
  }
};

// Mostrar formulario para editar dirección
exports.getEditAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, customerId: req.user.id }
    });

    if (!address) return res.redirect("/customer/addresses");

    res.render("customer/addresses-edit", {
      pageTitle: "Editar dirección",
      address,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getEditAddress:", error);
    next(error);
  }
};

// Guardar edición de dirección
exports.postEditAddress = async (req, res, next) => {
  const { id, name, description } = req.body;

  try {
    const address = await Address.findOne({
      where: { id, customerId: req.user.id }
    });

    if (!address) return res.redirect("/customer/addresses");

    address.name = name;
    address.description = description;

    await address.save();
    res.redirect("/customer/addresses");
  } catch (error) {
    console.log("Error al editar dirección:", error);
    next(error);
  }
};

// Confirmar eliminación de dirección
exports.getConfirmDeleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, customerId: req.user.id }
    });

    if (!address) return res.redirect("/customer/addresses");

    res.render("customer/addresses-delete", {
      pageTitle: "Eliminar dirección",
      address,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getConfirmDeleteAddress:", error);
    next(error);
  }
};

// Eliminar dirección
exports.postDeleteAddress = async (req, res, next) => {
  const { id } = req.body;

  try {
    await Address.destroy({
      where: { id, customerId: req.user.id }
    });

    res.redirect("/customer/addresses");
  } catch (error) {
    console.log("Error al eliminar dirección:", error);
    next(error);
  }
};

//#endregion 

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

exports.addFavorite = async (req, res, next) => {
  const customerId = req.user.id;
  const merchantId = req.params.merchantId;

  try {
    const exists = await Favorite.findOne({ where: { customerId, merchantId } });
    if (!exists) {
      await Favorite.create({ customerId, merchantId });
    }
    res.redirect("back");
  } catch (error) {
    console.log("Error al agregar favorito:", error);
    next(error);
  }
};
exports.removeFavorite = async (req, res, next) => {
  const customerId = req.user.id;
  const merchantId = req.params.merchantId;

  try {
    await Favorite.destroy({ where: { customerId, merchantId } });
    res.redirect("back");
  } catch (error) {
    console.log("Error al quitar favorito:", error);
    next(error);
  }
};
