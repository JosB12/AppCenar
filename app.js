const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const sequelize = require("./context/AppContext");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const flash = require("connect-flash");
const csrf = require("csurf");
const csrfProtection = csrf();
const bodyParser = require("body-parser");
const { allowInsecurePrototypeAccess } = require("@handlebars/allow-prototype-access");
const Handlebars = require("handlebars");

//#region Models
const User = require("./models/User");
const MerchantType = require("./models/MerchantType");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const OrderProduct = require("./models/OrderProduct");
const Address = require("./models/Address");
const Favorite = require("./models/Favorite");
const Configuration = require("./models/Configuration");
//#endregion

//#region Routes & Controllers
const PORT = 1200;
const authRouter = require("./routes/auth");
const merchantRouter = require("./routes/merchants");
const customerRouter = require("./routes/customer");

// Controller
const errorController = require("./controllers/ErrorController");
//#endregion

const app = express();
const compareHelpers = require("./util/helpers/hbs/compare");

app.engine(
  "hbs",
  expressHbs({
    layoutsDir: "views/layouts/",
    defaultLayout: "main-layout",
    extname: "hbs",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      eq: compareHelpers.eq

    },
  })
);
app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.urlencoded({ extended: false }));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});
app.use(multer({ storage: fileStorage }).any());

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: "anything",
    resave: true,
    saveUninitialized: false,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session) {
    return next();
  }
  if (!req.session.user) {
    return next();
  }
  User.findByPk(req.session.user.id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});
// Middleware para asignar el userRole a res.locals
app.use((req, res, next) => {
  res.locals.userRole = req.user ? req.user.role : null;
  next();
});

app.use((req, res, next) => {
  const errors = req.flash("errors");
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.errorMessages = errors;
  res.locals.hasErrorMessages = errors.length > 0;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Redirige a /login
app.get("/", (req, res, next) => {
  res.redirect("/login");
});

// Monta las rutas de autenticación
app.use(authRouter);
app.use("/customer",customerRouter);
app.use("/merchant",merchantRouter);

// Middleware para manejar rutas no encontradas (404)
app.use(errorController.Get404);


//#region relationships
// 1. Relación entre User y MerchantType (para merchants)
User.belongsTo(MerchantType, {
  foreignKey: "merchantTypeId",
  constraints: true,
  onDelete: "CASCADE",
});
MerchantType.hasMany(User, {
  foreignKey: "merchantTypeId",
});

// 2. Relación entre Category y User (merchant)
Category.belongsTo(User, {
  as: "merchant",
  foreignKey: "merchantId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Category, {
  as: "categories",
  foreignKey: "merchantId",
});

// 3. Relación entre Product y Category
Product.belongsTo(Category, {
  foreignKey: "categoryId",
  constraints: true,
  onDelete: "CASCADE",
});
Category.hasMany(Product, {
  foreignKey: "categoryId",
});

// 4. Relación entre Product y User (merchant)
Product.belongsTo(User, {
  as: "merchant",
  foreignKey: "merchantId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Product, {
  as: "products",
  foreignKey: "merchantId",
});

// 5. Relaciones en Order
// Order pertenece a un customer (User con rol "customer")
Order.belongsTo(User, {
  as: "customer",
  foreignKey: "customerId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Order, {
  as: "customerOrders",
  foreignKey: "customerId",
});
// Order pertenece a un merchant (User con rol "merchant")
Order.belongsTo(User, {
  as: "merchant",
  foreignKey: "merchantId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Order, {
  as: "merchantOrders",
  foreignKey: "merchantId",
});
// Order pertenece opcionalmente a un delivery (User con rol "delivery")
Order.belongsTo(User, {
  as: "delivery",
  foreignKey: "deliveryId",
  constraints: false,
});
User.hasMany(Order, {
  as: "deliveryOrders",
  foreignKey: "deliveryId",
});
// Order se asocia a Address
Order.belongsTo(Address, {
  foreignKey: "addressId",
  constraints: true,
  onDelete: "CASCADE",
});
Address.hasMany(Order, {
  foreignKey: "addressId",
});

// 6. Relación entre OrderProduct y Order
OrderProduct.belongsTo(Order, {
  foreignKey: "orderId",
  constraints: true,
  onDelete: "CASCADE",
});
Order.hasMany(OrderProduct, {
  foreignKey: "orderId",
});
// OrderProduct se asocia a Product
OrderProduct.belongsTo(Product, {
  foreignKey: "productId",
  constraints: true,
  onDelete: "CASCADE",
});
Product.hasMany(OrderProduct, {
  foreignKey: "productId",
});

// 7. Relación entre Address y User (customer)
Address.belongsTo(User, {
  as: "customer",
  foreignKey: "customerId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Address, {
  as: "addresses",
  foreignKey: "customerId",
});

// 8. Relación en Favorite
Favorite.belongsTo(User, {
  as: "customer",
  foreignKey: "customerId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Favorite, {
  as: "favorites",
  foreignKey: "customerId",
});
Favorite.belongsTo(User, {
  as: "merchant",
  foreignKey: "merchantId",
  constraints: true,
  onDelete: "CASCADE",
});
User.hasMany(Favorite, {
  as: "favoritedBy",
  foreignKey: "merchantId",
});
//#endregion

// correr para crear base de datos y comentar el siguiente bloque de codigo
// sequelize
//   .sync() // Puedes agregar { force: true } si deseas recrear las tablas cada vez (para desarrollo)
//   .then(() => {
//     console.log("Tablas sincronizadas con la base de datos.");
//     app.listen(PORT, () => {
//       console.log(`Servidor en http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) =>
//     console.error("Error al sincronizar las tablas:", err)
//   );

  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});