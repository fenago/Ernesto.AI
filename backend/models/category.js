/**
 * import the mongoose package
 */
const Mongoose = require("mongoose");

/**
 * define a schema
 */
const Schema = Mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

module.exports = Mongoose.model("category", categorySchema);
