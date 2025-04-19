const Sequelize = require("sequelize");
const path = require("path");

// cambiar la base de datos a la mysql local de cada quien
const sequelize = new Sequelize("appcenar", "root", "12052004", {
  dialect: "mysql",
  host: "localhost",
  port: "3306"
});

// const sequelize = new Sequelize("sqlite::memory:",{
//   dialect: "sqlite",
//   storage: path.join(path.dirname(require.main.filename), "database", "appcenar.sqlite")
// });

module.exports = sequelize;
