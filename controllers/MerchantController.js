const Order = require("../models/Order");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Sequelize = require("sequelize");
const OrderProduct = require("../models/OrderProduct");
const User = require("../models/User");



//#region Home Merchant
exports.getHome = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { merchantId: req.user.id },
      include: [
        {
          model: User,
          as: "merchant",
          attributes: ["merchantName", "merchantLogo"]
        },
        {
          model: OrderProduct,
          as: "order_products",
          attributes: ["id"]
        }
      ],
      order: [["orderDateTime", "DESC"]]
    });

    const ordersWithCounts = orders.map(order => {
      const dateObj = new Date(order.orderDateTime);

      return {
        ...order.toJSON(),
        totalProducts: order.order_products.length,
        formattedDate: dateObj.toLocaleDateString("es-DO"),       // ej: 20/4/2024
        formattedTime: dateObj.toLocaleTimeString("es-DO", {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })                                                        // ej: 15:30
      };
    });

    res.render("merchant/home", {
      pageTitle: "Inicio del Comercio",
      orders: ordersWithCounts,
      homeActive: true
    });
  } catch (error) {
    console.log("Error en getHome de MerchantController:", error);
    next(error);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findOne({
      where: { id: orderId, merchantId: req.user.id },
      include: [
        {
          model: User,
          as: "merchant",
          attributes: ["merchantName", "merchantLogo"]
        },
        {
          model: OrderProduct,
          as: "order_products",
          include: [
            {
              model: Product,
              attributes: ["name", "image", "price"]
            }
          ]
        }
      ]
    });

    if (!order) return res.redirect("/merchant/home");

    const orderJSON = order.toJSON();
    const dateObj = new Date(order.orderDateTime);

    res.render("merchant/order-detail", {
      pageTitle: `Detalle del Pedido #${order.id}`,
      order: {
        ...orderJSON,
        formattedDate: dateObj.toLocaleDateString("es-DO"),
        formattedTime: dateObj.toLocaleTimeString("es-DO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      },
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getOrderDetail:", error);
    next(error);
  }
};

exports.assignDelivery = async (req, res, next) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        merchantId: req.user.id,
        status: "PENDIENTE"
      }
    });

    if (!order) {
      req.flash("errors", "Pedido no válido o ya en proceso.");
      return res.redirect("/merchant/home");
    }

    // Buscar todos los repartidores activos y disponibles
    const deliveries = await User.findAll({
      where: {
        role: "delivery",
        active: true,
        availability: "disponible"
      }
    });

    if (!deliveries.length) {
      req.flash("errors", "No hay repartidores disponibles en este momento. Intente más tarde.");
      return res.redirect(`/merchant/orders/${orderId}`);
    }

    // Obtener la cantidad de órdenes por delivery
    const deliveryWithCounts = await Promise.all(
      deliveries.map(async (delivery) => {
        const count = await Order.count({ where: { deliveryId: delivery.id } });
        return { delivery, totalOrders: count };
      })
    );

    // Ordenar por la menor cantidad de pedidos hechos
    const sorted = deliveryWithCounts.sort((a, b) => a.totalOrders - b.totalOrders);
    const selectedDelivery = sorted[0].delivery;

    // Asignar el repartidor
    order.deliveryId = selectedDelivery.id;
    order.status = "EN PROCESO";
    await order.save();

    // Marcar repartidor como ocupado
    selectedDelivery.availability = "ocupado";
    await selectedDelivery.save();

    req.flash("success", "Repartidor asignado exitosamente.");
    res.redirect("/merchant/home");

  } catch (error) {
    console.log("Error al asignar delivery:", error);
    next(error);
  }
};




// controllers/MerchantController.js

// exports.assignDelivery = async (req, res, next) => {
//   const orderId = req.params.orderId;

//   try {
//     // 1) Buscar el pedido que aún está “pending” (pendiente)
//     const order = await Order.findOne({
//       where: {
//         id: orderId,
//         merchantId: req.user.id,
//         status: "PENDIENTE"            // coincide con el valor en la base de datos
//       }
//     });

//     if (!order) {
//       req.flash("errors", "Pedido no válido o ya en proceso.");
//       return res.redirect("/merchant/home");
//     }

//     // 2) Obtener todos los repartidores activos y disponibles
//     const disponibles = await User.findAll({
//       where: {
//         role: "delivery",
//         active: true,
//         availability: "disponible"
//       }
//     });

//     if (disponibles.length === 0) {
//       req.flash("errors", "No hay repartidores disponibles en este momento. Intenta más tarde.");
//       return res.redirect(`/merchant/orders/${orderId}`);
//     }

//     // 3) Calcular la carga (número de pedidos “EN PROCESO”) de cada repartidor
//     const cargas = await Promise.all(
//       disponibles.map(async d => {
//         const cuenta = await Order.count({
//           where: { deliveryId: d.id, status: "EN PROCESO" }
//         });
//         return { repartidor: d, carga: cuenta };
//       })
//     );

//     // 4) Elegir el repartidor con menor carga
//     cargas.sort((a, b) => a.carga - b.carga);
//     const elegido = cargas[0].repartidor;

//     // 5) Asignar el repartidor y cambiar el estado del pedido
//     order.deliveryId = elegido.id;
//     order.status     = "EN PROCESO";
//     await order.save();

//     // 6) Marcar al repartidor como “ocupado”
//     elegido.availability = "ocupado";
//     await elegido.save();

//     req.flash("success", "Repartidor asignado exitosamente.");
//     res.redirect("/merchant/home");

//   } catch (err) {
//     console.error("Error al asignar repartidor:", err);
//     next(err);
//   }
// };

//#endregion

//#region Merchant Profile
// Muestra el perfil del merchant para su edición
exports.getProfile = (req, res, next) => {
  res.render("merchant/profile", {
    pageTitle: "Merchant Profile",
    user: req.user, // req.user debe contener los datos del merchant
  });
};

exports.postProfile = async (req, res, next) => {
  const { merchantName, phone, email, openingTime, closingTime } = req.body;

  try {
    const updates = {
      merchantName,
      phone,
      email,
      openingTime,
      closingTime,
    };

    // Buscar archivo en req.files (porque estás usando .any())
    const logoFile = req.files?.find(file => file.fieldname === "merchantLogo");
    if (logoFile) {
      updates.merchantLogo = logoFile.filename;
    }

    await req.user.update(updates);
    res.redirect("/merchant/profile");
  } catch (error) {
    console.log("Error en postProfile de MerchantController:", error);
    next(error);
  }
};

//#endregion

//#region Merchant category
// Muestra el listado de categorías creadas por el merchant
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { merchantId: req.user.id },
      attributes: [
        'id',
        'name',
        'description',
        [Sequelize.fn('COUNT', Sequelize.col('products.id')), 'productCount']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [] // solo queremos contar
        }
      ],
      group: ['category.id'],
      order: [['name', 'ASC']]
    });

    res.render("merchant/categories", {
      pageTitle: "Mantenimiento de Categorías",
      categories: categories.map(c => c.toJSON())
    });
  } catch (error) {
    console.log("Error en getCategories de MerchantController:", error);
    next(error);
  }
};


exports.getCreateCategory = (req, res) => {
  res.render("merchant/categories-create", {
    pageTitle: "Crear Categoría",
    csrfToken: req.csrfToken()
  });
};

exports.postCreateCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    await Category.create({
      name,
      description,
      merchantId: req.user.id
    });
    res.redirect("/merchant/categories");
  } catch (error) {
    console.log("Error al crear categoría:", error);
    next(error);
  }
};

exports.getEditCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.categoryId, merchantId: req.user.id }
    });

    if (!category) return res.redirect("/merchant/categories");

    res.render("merchant/categories-edit", {
      pageTitle: "Editar Categoría",
      category,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getEditCategory:", error);
    next(error);
  }
};

exports.postEditCategory = async (req, res, next) => {
  const { id, name, description } = req.body;
  try {
    const category = await Category.findOne({
      where: { id, merchantId: req.user.id }
    });

    if (!category) return res.redirect("/merchant/categories");

    category.name = name;
    category.description = description;
    await category.save();

    res.redirect("/merchant/categories");
  } catch (error) {
    console.log("Error al editar categoría:", error);
    next(error);
  }
};

exports.getConfirmDeleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.categoryId, merchantId: req.user.id }
    });

    if (!category) return res.redirect("/merchant/categories");

    res.render("merchant/categories-delete", {
      pageTitle: "Eliminar Categoría",
      category,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getConfirmDeleteCategory:", error);
    next(error);
  }
};

exports.postDeleteCategory = async (req, res, next) => {
  const { id } = req.body;
  try {
    await Category.destroy({
      where: { id, merchantId: req.user.id }
    });
    res.redirect("/merchant/categories");
  } catch (error) {
    console.log("Error al eliminar categoría:", error);
    next(error);
  }
};
//#endregion

//#region Merchant product
// Muestra el listado de productos creados por el merchant
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { merchantId: req.user.id },
      include: [{ model: Category }]
    });

    res.render("merchant/products", {
      pageTitle: "Mantenimiento de Productos",
      products
    });
  } catch (error) {
    console.log("Error en getProducts de MerchantController:", error);
    next(error);
  }
};


exports.getCreateProduct = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { merchantId: req.user.id }
    });

    res.render("merchant/products-create", {
      pageTitle: "Crear Producto",
      categories,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getCreateProduct:", error);
    next(error);
  }
};

exports.postCreateProduct = async (req, res, next) => {
  const { name, description, price, categoryId } = req.body;
  try {
    const imageFile = req.files?.find(f => f.fieldname === "image");

    await Product.create({
      name,
      description,
      price,
      image: imageFile ? imageFile.filename : null,
      categoryId,
      merchantId: req.user.id
    });

    res.redirect("/merchant/products");
  } catch (error) {
    console.log("Error al crear producto:", error);
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, merchantId: req.user.id }
    });

    const categories = await Category.findAll({
      where: { merchantId: req.user.id }
    });

    if (!product) return res.redirect("/merchant/products");

    res.render("merchant/products-edit", {
      pageTitle: "Editar Producto",
      product,
      categories,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getEditProduct:", error);
    next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const { id, name, description, price, categoryId } = req.body;

  try {
    const product = await Product.findOne({
      where: { id, merchantId: req.user.id }
    });

    if (!product) return res.redirect("/merchant/products");

    const imageFile = req.files?.find(f => f.fieldname === "image");

    product.name = name;
    product.description = description;
    product.price = price;
    product.categoryId = categoryId;

    if (imageFile) {
      product.image = imageFile.filename;
    }

    await product.save();
    res.redirect("/merchant/products");
  } catch (error) {
    console.log("Error al editar producto:", error);
    next(error);
  }
};

exports.getConfirmDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, merchantId: req.user.id }
    });

    if (!product) return res.redirect("/merchant/products");

    res.render("merchant/products-delete", {
      pageTitle: "Eliminar Producto",
      product,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log("Error en getConfirmDeleteProduct:", error);
    next(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  const { id } = req.body;

  try {
    await Product.destroy({
      where: { id, merchantId: req.user.id }
    });
    res.redirect("/merchant/products");
  } catch (error) {
    console.log("Error al eliminar producto:", error);
    next(error);
  }
};

//#endregion
