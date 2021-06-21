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

const resourceGroupSchema = new Schema({
  name: {
    type: String,
  },
  multiplier: {
    type: Number,
  },
  createdAt: {
    type: String
  },
  modifiedAt: {
    type: String
  }
});

module.exports = Mongoose.model("resourceGroup", resourceGroupSchema);
