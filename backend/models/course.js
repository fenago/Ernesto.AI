/**
 * import the mongoose package
 */
const Mongoose = require("mongoose");

/**
 * define a schema
 */
const Schema = Mongoose.Schema;

const courseSchema = new Schema({
  id: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tag: {
    type: String
  },
  ports: {
    type: String,
    required: true
  },
  version: {
    type: String
  },
  defaultRepository: {
    type: String
  },
  customRepository: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metaTagTitle: {
    type: String
  },
  metaTagDescription: {
    type: String
  },
  metaTagKeywords: {
    type: String
  },
  defaultMEM: {
    type: Number,
    required: true
  },
  isCustomImage: {
    type: Boolean
  },
  price: {
    type: Number
  },
  image: {
    type: String
  },
  gpuType: {
    type: String,
    required: true
  },
  gpuCount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  containerSize: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  },
  cpuCount: {
    type: Number,
    required: true
  },
  dnsName: {
    type: String,
    required: false
  }
});

module.exports = Mongoose.model("course", courseSchema);
