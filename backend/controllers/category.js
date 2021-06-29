// model
const CategoryModel = require("../models/category");
const basicUtilService = require("../services/basicUtilService");
const basicConstantService = require("../services/basicConstantService");

// packages
const { isEmpty: lodashIsEmpty } = require("lodash");

/**
 * @route {GET} category/
 * @description returns all categories or filtered ones
 * @query {Object} { limit: Number, sort: String, page: Number, searchText: String, selectedFields: Array }
 */
const retrieveAll = async (req, res) => {
  try {
    const modelName = basicConstantService.modelNames.category;
    const query = basicUtilService.makeQuery(req.query, modelName); // this will return filters, fields to fetch and options for database query

    const categoriesCount = CategoryModel.countDocuments(query.filters)

    const categories = CategoryModel.find(
      query.filters,
      query.fields,
      query.options
    );

    const promises = [categoriesCount, categories]
    Promise.all(promises).then((result => {
      res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        count: result[0], // returns Number
        categories: result[1] // returns Array
      });
    }))

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {POST} category/
 * @description add a new category
 */
const create = async (req, res) => {
  try {
    const newCategory = new CategoryModel({ ...req.body });

    const category = await newCategory.save();

    res.status(200).json({
      success: true,
      message: "Category added successfully",
      category // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {GET} category/{id}
 * @description returns a specific category
 */
const retrieve = async (req, res) => {
  try {
    const id = req.params.id;

    const category = await CategoryModel.findById({ _id: id });

    if (!category || lodashIsEmpty(category)) {
      return res
        .status(401)
        .json({ success: false, message: "Category does not exist" });
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      category // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {PATCH} category/{id}
 * @description update category details
 */
const update = async (req, res) => {
  try {
    const payload = req.body;
    const id = req.params.id;

    const category = await CategoryModel.findByIdAndUpdate(
      { _id: id },
      { $set: payload },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Category has been updated",
      category // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {DELETE} category/{id}
 * @description delete category
 */
const destroy = async (req, res) => {
  try {
    const id = req.params.id;

    await CategoryModel.findByIdAndDelete({ _id: id });

    res
      .status(200)
      .json({ success: true, message: "Category has been deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {GET} category/seed
 * @description seed categories into the database -  // to populate database for testing purpose only
 */
const seed = async (req, res) => {
  let categories = [];
  let categories_ = [
    {
      name: "Comedy",
      imageUrl: ""
    },
    {
      name: "Concerts",
      imageUrl: ""
    },
    {
      name: "Festivals",
      imageUrl: ""
    },
    {
      name: "ComNightlifeedy",
      imageUrl: ""
    },
    {
      name: "Sport",
      imageUrl: ""
    }
  ];

  try {
    categories_.forEach((category_) => {
      const newCategory = new CategoryModel({
        ...category_
      });
      let category = newCategory.save();
      categories.push(category);
    });

    res.status(200).json({
      success: true,
      message: "Database seeded!",
      categories // returns Array
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  retrieveAll,
  create,
  retrieve,
  update,
  destroy,
  seed
};
