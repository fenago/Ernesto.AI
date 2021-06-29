// routes
const CategoryRoute = require("./category");
const CoursesRoute = require("./course");

// middlewares
const Authenticate = require("../middlewares/authenticate");

// export
module.exports = (app) => {
  app.use("/category", Authenticate, CategoryRoute);
  app.use("/course", Authenticate, CoursesRoute);
};
