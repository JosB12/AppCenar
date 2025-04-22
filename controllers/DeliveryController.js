const Order        = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");
const Product      = require("../models/Product");
const Address      = require("../models/Address");
const User         = require("../models/User");


exports.getHome = async (req, res, next) => {
  try {
    // 1) Traemos los pedidos "raw"
    const rawOrders = await Order.findAll({
      where: { deliveryId: req.user.id },
      include: [
        { model: User, as: "merchant" },
        {
          model: OrderProduct,
          as: "order_products",
          include: [{ model: Product }]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // 2) Mappeamos para la vista
    const orders = rawOrders.map(o => {
      const when = o.createdAt;
      const formattedDate = when.toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const formattedTime = when.toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      return {
        id: o.id,
        merchant: o.merchant,
        // traducimos el status
        status: o.status === "processing" ? "EN PROCESO"
               : o.status === "completed"  ? "COMPLETADO"
               : o.status.toUpperCase(),
        orderCount: o.order_products.length,
        formattedDate,
        formattedTime
      };
    });

    // 3) Renderizamos ya con los datos listos
    res.render("delivery/home", {
      pageTitle: "Delivery Dashboard",
      orders,
      homeActive: true,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    next(err);
  }
};



exports.getOrderDetail = async (req, res, next) => {
  try {
    // 1. Obtengo el pedido, con merchant, dirección y productos
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
        deliveryId: req.user.id
      },
      include: [
        {
          model: User,
          as: "merchant",
          attributes: ["merchantName", "merchantLogo"]
        },
        {
          model: Address,
          attributes: ["description"]
        },
        {
          model: OrderProduct,
          as: "order_products",
          include: [{
            model: Product,
            attributes: ["name", "price", "image"]
          }]
        }
      ]
    });

    if (!order) {
      return res.redirect("/delivery/home");
    }

    // 2. Formateo fecha y hora
    const when = order.orderDateTime || order.createdAt;
    order.formattedDate = when.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    order.formattedTime = when.toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    // 3. Aseguro que el status esté en mayúsculas en español
    order.status = order.status.toUpperCase() === "COMPLETED"
      ? "COMPLETADO"
      : order.status.toUpperCase() === "IN PROCESS"
        ? "EN PROCESO"
        : order.status.toUpperCase();

    // 4. Renderizo la vista pasando todo lo necesario
    res.render("delivery/order-detail", {
      pageTitle: `Pedido #${order.id}`,
      order,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    next(err);
  }
};

exports.postCompleteOrder = async (req, res, next) => {
  try {
    // Localizo el pedido asignado a este delivery
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
        deliveryId: req.user.id
      }
    });

    if (!order) {
      return res.redirect("/delivery/home");
    }

    // Marco como completado
    order.status = "COMPLETADO";
    await order.save();

    // Marco al delivery como disponible de nuevo
    req.user.available = true;
    await req.user.save();

    // Redirijo al mismo detalle (ahora sin el botón "Completar")
    res.redirect(`/delivery/order/${order.id}`);
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
