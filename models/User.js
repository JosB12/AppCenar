// models/User.js
const Sequelize = require("sequelize");
const sequelize = require("../context/AppContext");

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  cedula: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  profilePhoto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  resetToken: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  resetTokenExpiration: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  role: {
    type: Sequelize.ENUM("customer", "delivery", "merchant", "admin"),
    allowNull: false,
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  // Campos específicos para merchants:
  merchantName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  merchantLogo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  openingTime: {
    type: Sequelize.TIME,
    allowNull: true,
  },
  closingTime: {
    type: Sequelize.TIME,
    allowNull: true,
  },
  // Relación con MerchantType (se asignará en las asociaciones)
  merchantTypeId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  activationToken: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  availability: {
    type: Sequelize.ENUM('disponible','ocupado'),
    allowNull: true,
  }
});

module.exports = User;
