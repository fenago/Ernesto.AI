// model
const CourseModel = require("../models/course");
const basicUtilService = require("../services/basicUtilService");
const basicConstantService = require("../services/basicConstantService");

// packages
const { isEmpty: lodashIsEmpty } = require("lodash");

/**
 * @route {GET} course/
 * @description returns all courses or filtered ones
 * @query {Object} { limit: Number, sort: String, page: Number, searchText: String, selectedFields: Array }
 */
const retrieveAll = async (req, res) => {
  try {
    const modelName = basicConstantService.modelNames.course;
    const query = basicUtilService.makeQuery(req.query, modelName); // this will return filters, fields to fetch and options for database query

    const coursesCount = CourseModel.countDocuments(query.filters)
    
    const courses = CourseModel.find(
      query.filters,
      query.fields,
      query.options
    );

    const promises = [coursesCount, courses]
    Promise.all(promises).then(result => {
      res.status(200).json({
        success: true,
        message: "Courses fetched successfully",
        count: result[0], // returns Number
        courses: result[1] // returns Array
      });
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {POST} course/
 * @description add a new course
 */
const create = async (req, res) => {
  try {
    const newCourse = new CourseModel({ ...req.body });

    const course = await newCourse.save();

    res.status(200).json({
      success: true,
      message: "Course added successfully",
      course // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {GET} course/{id}
 * @description returns a specific course
 */
const retrieve = async (req, res) => {
  try {
    const id = req.params.id;

    const course = await CourseModel.findById({ _id: id });

    if (!course || lodashIsEmpty(course)) {
      return res
        .status(401)
        .json({ success: false, message: "Course does not exist" });
    }

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      course // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {PATCH} course/{id}
 * @description update course details
 */
const update = async (req, res) => {
  try {
    const payload = req.body;
    const id = req.params.id;

    const course = await CourseModel.findByIdAndUpdate(
      { _id: id },
      { $set: payload },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Course has been updated",
      course // returns Object
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {DELETE} course/{id}
 * @description delete course
 */
const destroy = async (req, res) => {
  try {
    const id = req.params.id;

    await CourseModel.findByIdAndDelete({ _id: id });

    res.status(200).json({ success: true, message: "Course has been deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route {GET} course/seed
 * @description seed courses into the database -  // to populate database for testing purpose only
 */
const seed = async (req, res) => {
  let courses = [];
  let courses_ = [
    {
      id: "_u5b0toe1fc",
      name: "Machine Learning Code Lab",
      imageUrl: "dockerhub.com",
      tag: "",
      ports: "80",
      version: null,
      customRepository: "fenago/machine-learning",
      description: "Machine Learning Lab Environment to Create AI solution",
      metaTagTitle: "title",
      metaTagDescription: "",
      metaTagKeywords: "",
      defaultMEM: 4,
      processor: "cpu",
      isCustomImage: true,
      price: 0.06196,
      image: "",
      defaultProcessor: 2,
      __v: 0,
      category: "5ef6773d1b1a3d2b58be4f4d",
      defaultRepository: null,
      containerSize: 15,
      active: true,
      gpuCount: null,
      gpuType: null,
      cpuCount: null,
      dnsName: null
    },
    {
      id: "_u5b0toe1fd",
      name: "Data Science Code Lab",
      imageUrl: "dockerhub.com",
      tag: "",
      ports: "80",
      version: null,
      customRepository: "fenago/machine-learning",
      description: "Machine Learning Lab Environment to Create AI solution",
      metaTagTitle: "title",
      metaTagDescription: "",
      metaTagKeywords: "",
      defaultMEM: 4,
      processor: "cpu",
      isCustomImage: true,
      price: 0.06196,
      image: "",
      defaultProcessor: 2,
      __v: 0,
      category: "5ef6773d1b1a3d2b58be4f4d",
      defaultRepository: null,
      containerSize: 15,
      active: true,
      gpuCount: null,
      gpuType: null,
      cpuCount: null,
      dnsName: null
    }
  ];

  try {
    courses_.forEach((course_) => {
      const newCourse = new CourseModel({
        ...course_
      });
      let course = newCourse.save();
      courses.push(course);
    });

    res.status(200).json({
      success: true,
      message: "Database seeded!",
      courses // returns Array
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
