// models/Favorite.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Favorite = sequelize.define("favorite", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  }
  // Se agregarán las claves foráneas 'customerId' y 'merchantId' en las asociaciones.
});

module.exports = Favorite;
