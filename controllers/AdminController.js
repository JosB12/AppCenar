// controllers/AdminController.js
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Configuration = require("../models/Configuration");
const MerchantType = require("../models/MerchantType");

exports.getDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalOrders = await Order.count();
    const todayOrders = await Order.count({
      where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
    });
    const totalProducts = await Product.count();

    const activeCustomers   = await User.count({ where: { role: "customer", active: true } });
    const inactiveCustomers = await User.count({ where: { role: "customer", active: false } });

    const activeDelivery   = await User.count({ where: { role: "delivery", active: true } });
    const inactiveDelivery = await User.count({ where: { role: "delivery", active: false } });

    const activeMerchants   = await User.count({ where: { role: "merchant", active: true } });
    const inactiveMerchants = await User.count({ where: { role: "merchant", active: false } });

    const activeAdmins   = await User.count({ where: { role: "admin", active: true } });
    const inactiveAdmins = await User.count({ where: { role: "admin", active: false } });

    res.render("admin/home", {
      pageTitle: "Admin Dashboard",
      totalOrders, todayOrders, totalProducts,
      activeCustomers, inactiveCustomers,
      activeDelivery, inactiveDelivery,
      activeMerchants, inactiveMerchants,
      activeAdmins, inactiveAdmins,
      homeActive: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const users = await User.findAll({ where: { role: "customer" } });
    const customers = await Promise.all(users.map(async u => {
      const orderCount = await Order.count({ where: { customerId: u.id } });
      return { ...u.get({ plain: true }), orderCount };
    }));
    res.render("admin/customers", { pageTitle: "Customers", customers });
  } catch (err) {
    next(err);
  }
};

exports.postActivateCustomer = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = true;
    await u.save();
    res.redirect("/admin/customers");
  } catch (err) {
    next(err);
  }
};

exports.postDeactivateCustomer = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = false;
    await u.save();
    res.redirect("/admin/customers");
  } catch (err) {
    next(err);
  }
};

exports.getDeliveries = async (req, res, next) => {
  try {
    const users = await User.findAll({ where: { role: "delivery" } });
    const deliveries = await Promise.all(users.map(async u => {
      const deliveryCount = await Order.count({ where: { deliveryId: u.id } });
      return { ...u.get({ plain: true }), deliveryCount };
    }));
    res.render("admin/deliveries", { pageTitle: "Deliveries", deliveries });
  } catch (err) {
    next(err);
  }
};

exports.postActivateDelivery = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = true;
    await u.save();
    res.redirect("/admin/deliveries");
  } catch (err) {
    next(err);
  }
};

exports.postDeactivateDelivery = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = false;
    await u.save();
    res.redirect("/admin/deliveries");
  } catch (err) {
    next(err);
  }
};

exports.getMerchants = async (req, res, next) => {
  try {
    const users = await User.findAll({ where: { role: "merchant" } });
    const merchants = await Promise.all(users.map(async u => {
      const orderCount = await Order.count({ where: { merchantId: u.id } });
      return { ...u.get({ plain: true }), orderCount, logo: u.profilePhoto };
    }));
    res.render("admin/merchants", { pageTitle: "Merchants", merchants });
  } catch (err) {
    next(err);
  }
};

exports.postActivateMerchant = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = true;
    await u.save();
    res.redirect("/admin/merchants");
  } catch (err) {
    next(err);
  }
};

exports.postDeactivateMerchant = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    u.active = false;
    await u.save();
    res.redirect("/admin/merchants");
  } catch (err) {
    next(err);
  }
};

exports.getConfiguration = async (req, res, next) => {
  try {
    const config = await Configuration.findOne();
    res.render("admin/configuration", { pageTitle: "Configuration", config });
  } catch (err) {
    next(err);
  }
};

exports.getEditConfiguration = async (req, res, next) => {
  try {
    const config = await Configuration.findOne();
    res.render("admin/configuration-edit", { pageTitle: "Edit Configuration", config });
  } catch (err) {
    next(err);
  }
};

exports.postConfiguration = async (req, res, next) => {
  try {
    let config = await Configuration.findOne();
    if (!config) {
      config = await Configuration.create({ itbis: req.body.itbis });
    } else {
      config.itbis = req.body.itbis;
      await config.save();
    }
    res.redirect("/admin/configuration");
  } catch (err) {
    next(err);
  }
};

exports.getAdmins = async (req, res, next) => {
  try {
    const users = await User.findAll({ where: { role: "admin" } });
    const admins = users.map(u => u.get({ plain: true }));
    res.render("admin/admins", { pageTitle: "Admins", admins });
  } catch (err) {
    next(err);
  }
};

exports.getCreateAdmin = (req, res) => {
  res.render("admin/admin-create", { pageTitle: "Create Admin" });
};

exports.postCreateAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, cedula, email, username, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash("errors", "Passwords do not match");
      return res.redirect("/admin/admins/new");
    }
    // hash password
    const hashed = await bcrypt.hash(password, 12);
    await User.create({ firstName, lastName, cedula, email, username, password: hashed, role: "admin", active: true });
    res.redirect("/admin/admins");
  } catch (err) {
    next(err);
  }
};

exports.getEditAdmin = async (req, res, next) => {
  try {
    const admin = await User.findByPk(req.params.id);
    res.render("admin/admin-edit", { pageTitle: "Edit Admin", admin: admin.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
};

exports.postEditAdmin = async (req, res, next) => {
  try {
    const admin = await User.findByPk(req.params.id);
    // Prevent editing yourself
    if (admin.id === req.user.id) {
      req.flash("errors", "You cannot edit your own account here.");
      return res.redirect("/admin/admins");
    }
    const { firstName, lastName, cedula, email, username, password, confirmPassword } = req.body;
    Object.assign(admin, { firstName, lastName, cedula, email, username });
    if (password) {
      if (password !== confirmPassword) {
        req.flash("errors", "Passwords do not match");
        return res.redirect(`/admin/admins/${req.params.id}/edit`);
      }
      admin.password = await bcrypt.hash(password, 12);
    }
    await admin.save();
    res.redirect("/admin/admins");
  } catch (err) {
    next(err);
  }
};

exports.postActivateAdmin = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    // Prevent self-deactivation/reactivation
    if (u.id === req.user.id) {
      req.flash("errors", "You cannot change your own active status.");
      return res.redirect("/admin/admins");
    }
    u.active = true;
    await u.save();
    res.redirect("/admin/admins");
  } catch (err) {
    next(err);
  }
};

exports.postDeactivateAdmin = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (u.id === req.user.id) {
      req.flash("errors", "You cannot change your own active status.");
      return res.redirect("/admin/admins");
    }
    u.active = false;
    await u.save();
    res.redirect("/admin/admins");
  } catch (err) {
    next(err);
  }
};

exports.getMerchantTypes = async (req, res, next) => {
  try {
    const types = await MerchantType.findAll();
    const withCounts = await Promise.all(types.map(async t => {
      const merchantCount = await User.count({ where: { merchantTypeId: t.id } });
      return { ...t.get({ plain: true }), merchantCount };
    }));
    res.render("admin/merchant-types", { pageTitle: "Merchant Types", types: withCounts });
  } catch (err) {
    next(err);
  }
};

exports.getCreateMerchantType = (req, res) => {
  res.render("admin/merchant-type-create", { pageTitle: "Create Merchant Type" });
};

exports.postCreateMerchantType = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const iconFile = (req.files || []).find(f => f.fieldname === "icon");
    if (!name || !description || !iconFile) {
      req.flash("errors", "All fields including the icon are required.");
      return res.redirect("/admin/merchant-types/new");
    }
    await MerchantType.create({
      name,
      description,
      icon: iconFile.path
    });
    req.flash("success", "Merchant type created successfully.");
    res.redirect("/admin/merchant-types");
  } catch (err) {
    next(err);
  }
};

exports.getEditMerchantType = async (req, res, next) => {
  try {
    const type = await MerchantType.findByPk(req.params.id);
    res.render("admin/merchant-type-edit", { pageTitle: "Edit Merchant Type", type: type.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
};

exports.postEditMerchantType = async (req, res, next) => {
  try {
    const type = await MerchantType.findByPk(req.params.id);
    if (!type) {
      req.flash("errors", "Merchant type not found");
      return res.redirect("/admin/merchant-types");
    }
    type.name = req.body.name;
    type.description = req.body.description;
    const iconFile = (req.files || []).find(f => f.fieldname === "icon");
    if (iconFile) {
      type.icon = iconFile.path;
    }
    await type.save();
    req.flash("success", "Merchant type updated successfully.");
    res.redirect("/admin/merchant-types");
  } catch (err) {
    next(err);
  }
};

exports.postDeleteMerchantType = async (req, res, next) => {
  try {
    await MerchantType.destroy({ where: { id: req.params.id } });
    res.redirect("/admin/merchant-types");
  } catch (err) {
    next(err);
  }
};
