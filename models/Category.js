// models/Category.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Category = sequelize.define("category", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  }
  // Se agregará la clave foránea 'merchantId' en las asociaciones.
});

module.exports = Category;
