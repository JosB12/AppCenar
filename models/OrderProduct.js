// models/OrderProduct.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const OrderProduct = sequelize.define("orderProduct", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  }
  // Se agregará la clave foránea 'orderId' y 'productId' en las asociaciones.
});

module.exports = OrderProduct;
