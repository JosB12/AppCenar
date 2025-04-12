// models/Address.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Address = sequelize.define("address", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {   // Nombre de la dirección (alias o etiqueta)
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  }
  // Se agregará la clave foránea 'customerId' en las asociaciones.
});

module.exports = Address;
