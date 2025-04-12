// models/Order.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Order = sequelize.define("order", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  status: {
    type: Sequelize.ENUM("pending", "processing", "completed"),
    allowNull: false,
    defaultValue: "pending"
  },
  orderDateTime: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  subtotal: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  total: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  }
  // Las claves foráneas 'customerId', 'merchantId', 'addressId' y 'deliveryId' se agregarán en las asociaciones.
});

module.exports = Order;
// models/Order.js