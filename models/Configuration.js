// models/Configuration.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const Configuration = sequelize.define("configuration", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  itbis: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  }
});

module.exports = Configuration;
