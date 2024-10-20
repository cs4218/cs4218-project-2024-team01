import {
  beforeEach,
  describe,
  expect,
  test,
  jest,
  beforeAll,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "../../controllers/categoryController";
import categoryModel from "../../models/categoryModel";
import { ObjectId } from "mongodb";

let mongoServer;
let res;
let req;

beforeEach(() => {
  res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  jest.clearAllMocks();
});

beforeEach(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongoServer.getUri();
  await mongoose.connect(mongoServer.getUri());
  await mongoose.connection.db.dropCollection("categories");
  await mongoose.connection.db.createCollection("categories");
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("For Create Category Controller", () => {
  beforeEach(() => {
    req = {
      body: { name: "new category" },
    };
  });

  describe("When category name is non empty and does not exist in database", () => {
    test("Category is created successfully and saved in database", async () => {
      await createCategoryController(req, res);

      let insertedCategory = await categoryModel.findOne({
        name: req.body.name,
      });
      expect(insertedCategory).not.toBeNull();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("new category created");
      expect(responseArgs.category._id).toStrictEqual(insertedCategory._id);
      expect(responseArgs.category.name).toBe(insertedCategory.name);
      expect(responseArgs.category.slug).toBe(insertedCategory.slug);
    });
  });

  describe("When error occurred in database", () => {
    test("Category is not saved in database", async () => {
      const error = new Error("Error finding existing category");
      jest.spyOn(categoryModel, "findOne").mockImplementation(() => {
        throw error;
      });

      await createCategoryController(req, res);

      let insertedCategory = await mongoose.connection.db
        .collection("categories")
        .findOne({ name: req.body.name });
      expect(insertedCategory).toBeNull();

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(error);
      expect(responseArgs.message).toBe("Errro in Category");
    });
  });
});

describe("For Update Category Controller", () => {
  const id = new ObjectId();

  beforeEach(() => {
    req = { params: { id }, body: { name: "updated category" } };
  });

  describe("When a category exists in database and its id and new category name are provided", () => {
    test("Category is updated successfully and saved in database", async () => {
      const oldCategory = new categoryModel({
        _id: id,
        name: "old category",
        slug: "old-category",
      });

      await oldCategory.save();

      await updateCategoryController(req, res);

      let updatedCategory = await categoryModel.findOne({
        name: req.body.name,
      });
      expect(updatedCategory).not.toBeNull();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.messsage).toBe("Category Updated Successfully");
      expect(responseArgs.category._id).toStrictEqual(updatedCategory._id);
      expect(responseArgs.category.name).toBe(updatedCategory.name);
      expect(responseArgs.category.slug).toBe(updatedCategory.slug);
    });
  });

  describe("When error occured in database", () => {
    test("Category is not updated in database", async () => {
      const oldCategory = new categoryModel({
        _id: id,
        name: "old category",
        slug: "old-category",
      });

      await oldCategory.save();

      const error = new Error("Error updating existing category");
      jest.spyOn(categoryModel, "findByIdAndUpdate").mockImplementation(() => {
        throw error;
      });

      await updateCategoryController(req, res);

      let updatedCategory = await categoryModel.findOne({
        name: req.body.name,
      });
      expect(updatedCategory).toBeNull();

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(error);
      expect(responseArgs.message).toBe("Error while updating category");
    });
  });
});

describe("For All Category Controller", () => {
  const categories = [
    {
      _id: new ObjectId(),
      name: "category one",
      slug: "category-one",
    },
    {
      _id: new ObjectId(),
      name: "category two",
      slug: "category-two",
    },
    {
      _id: new ObjectId(),
      name: "category three",
      slug: "category-three",
    },
  ];

  beforeEach(() => {
    req = {};
  });

  describe("When a list of categories exist in database", () => {
    test("Categories are successfully retrieved from database", async () => {
      await categoryModel.insertMany(categories);

      await categoryControlller(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("All Categories List");
      expect(responseArgs.category.length).toBe(3);
    });
  });

  describe("When error occured in database", () => {
    test("Categories are not retrieved from database", async () => {
      await categoryModel.insertMany(categories);

      const error = new Error("Error finding categories")
      jest.spyOn(categoryModel, "find").mockImplementation(() => {
        throw error;
      });

      await categoryControlller(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(error);
      expect(responseArgs.message).toBe("Error while getting all categories");
    });
  });
});

describe("For Single Category Controller", () => {
  beforeEach(() => {
    req = { params: { slug: "single-category" } };
  });

  describe("When a category exists in database and its slug is provided", () => {
    test("Category is retrieved successfully from database", async () => {
      const existingCategory = new categoryModel({
        _id: new ObjectId(),
        name: "single category",
        slug: "single-category",
      });

      await existingCategory.save();

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("Get SIngle Category SUccessfully");
      expect(responseArgs.category._id).toStrictEqual(existingCategory._id);
      expect(responseArgs.category.name).toBe(existingCategory.name);
      expect(responseArgs.category.slug).toBe(existingCategory.slug);
    });
  });

  describe("When error occured in database", () => {
    test("Single category is not retrieved from database", async () => {
      const existingCategory = new categoryModel({
        _id: new ObjectId(),
        name: "single category",
        slug: "single-category",
      });

      await existingCategory.save();

      const error = new Error("Error finding single category");
      jest.spyOn(categoryModel, "findOne").mockImplementation(() => {
        throw error;
      });

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(error);
      expect(responseArgs.message).toBe("Error While getting Single Category");
    });
  });
});

describe("For Delete Category Controller", () => {
  const id = new ObjectId();

  beforeEach(() => {
    req = { params: { id } };
  });

  describe("When a category exists in database and its id is provided", () => {
    test("Category is successfully deleted from database", async () => {
      const existingCategory = new categoryModel({
        _id: id,
        name: "single category",
        slug: "single-category",
      });

      await existingCategory.save();

      await deleteCategoryCOntroller(req, res);

      let deletedCategory = await categoryModel.findOne({
        name: "single category",
      });
      expect(deletedCategory).toBeNull();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });
  });

  describe("When error occured in database", () => {
    test("Category is not deleted from database", async () => {
      const existingCategory = new categoryModel({
        _id: id,
        name: "single category",
        slug: "single-category",
      });

      await existingCategory.save();

      const error = new Error("Error deleting category");
      jest.spyOn(categoryModel, "findByIdAndDelete").mockImplementation(() => {
        throw error;
      });

      await deleteCategoryCOntroller(req, res);

      let deletedCategory = await categoryModel.findOne({
        name: "single category",
      });
      expect(deletedCategory).not.toBeNull();

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(error);
      expect(responseArgs.message).toBe("error while deleting category");
    });
  });
});
