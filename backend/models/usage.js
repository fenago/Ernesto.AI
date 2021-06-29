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

const usageSchema = new Schema({}, { strict: false });

module.exports = Mongoose.model("usage", usageSchema);
