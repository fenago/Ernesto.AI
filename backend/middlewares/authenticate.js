const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.send(403, {
    error: "Forbidden! Please login again"
  });
};

module.exports = ensureAuthenticated;
