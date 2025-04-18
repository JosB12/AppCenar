// models/Product.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Product = sequelize.define("product", {
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
  image: {
    type: Sequelize.STRING, // Ruta o nombre del archivo de la imagen
    allowNull: true,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  // Se agregarán las claves foráneas 'categoryId' y 'merchantId' en las asociaciones.
});

module.exports = Product;
