/**
 * Example schema (Model) creation to understand how mongoose and mongodb work
 */

/**
 * import the mongoose package
 */
const Mongoose = require("mongoose");

/**
 * define a schema
 */
const Schema = Mongoose.Schema;

const userSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  resourceGroup: {
    type: String,
  },
  multiplier: {
    type: Number,
  },
});

module.exports = Mongoose.model("user", userSchema);
