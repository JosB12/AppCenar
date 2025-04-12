// models/MerchantType.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const MerchantType = sequelize.define("merchantType", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  icon: {
    type: Sequelize.STRING, // Ruta o nombre del archivo del icono
    allowNull: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  }
});

module.exports = MerchantType;
