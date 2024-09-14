import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "../controllers/categoryController";
import categoryModel from "../models/categoryModel";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");

let req;
let res;

beforeEach(() => {
  res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  jest.clearAllMocks();
})

describe("For Create Category Controller", () => {
  beforeEach(() => {
    req = { body: {} };
  });

  describe("Given name is empty", () => {
    test("Returns message that name is required", async () => {
      categoryModel.findOne = jest.fn();
      categoryModel.prototype.save = jest.fn();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledTimes(0);
      expect(categoryModel.prototype.save).toBeCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });
  });

  describe("Given name exists", () => {
    test("Returns message that category already exists", async () => {
      req.body.name = "exists";
      categoryModel.findOne = jest.fn().mockResolvedValueOnce({ name: "exists" });
      categoryModel.prototype.save = jest.fn();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({name : "exists"})
      expect(categoryModel.prototype.save).toBeCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });
  });

  describe("Given name does not exist", () => {
    test("Returns created category and the associated message", async () => {
      let expectedCategory = {
        name: "new category",
        slug: slugify("new category"),
      };

      req.body.name = "new category";

      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.prototype.save = jest
        .fn()
        .mockResolvedValueOnce(expectedCategory);

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledWith({name: "new category"});
      expect(categoryModel.prototype.save).toBeCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: expectedCategory,
      });
    });
  });

  describe("Given an unexpected error during querying", () => {
    test("Returns message that an error occurred when creating category", async () => {
      req.body.name = "new category";

      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.findOne = jest.fn().mockRejectedValueOnce(unexpectedError);
      categoryModel.prototype.save = jest.fn();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledWith({name: "new category"});
      expect(categoryModel.prototype.save).toBeCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "Errro in Category",
      });
    });
  });

  describe("Given an unexpected error during saving", () => {
    test("Returns message that an error occurred when creating category", async () => {
      req.body.name = "new category";

      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.findOne = jest.fn().mockResolvedValueOnce(null);
      categoryModel.prototype.save = jest
        .fn()
        .mockRejectedValueOnce(unexpectedError);

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledWith({name: "new category"});
      expect(categoryModel.prototype.save).toBeCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "Errro in Category",
      });
    });
  });
});

describe("For Update Category Controller", () => {
  beforeEach(() => {
    req = { params: { id: "1" }, body: { name: "updated category" } };
  });

  let updatedCategory = {
    name: "updated category",
    slug: slugify("updated category"),
  };

  describe("Given a new category name and existing id", () => {
    test("Returns updated category and the associated message", async () => {
      categoryModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(updatedCategory);

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toBeCalledWith(
        "1",
        updatedCategory,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: updatedCategory,
      });
    });
  });

  describe("Given an unexpected error during querying", () => {
    test("Returns message that an error occurred while updating category", async () => {
      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValueOnce(unexpectedError);

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toBeCalledWith(
        "1",
        updatedCategory,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "Error while updating category",
      });
    });
  });
});

describe("For All Category Controller", () => {
  beforeEach(() => {
    req = {};
  });

  describe("Given a successful request", () => {
    test("Returns all categories and the associated message", async () => {
      let categories = [
        {
          name: "category one",
          slug: slugify("category one"),
        },
        {
          name: "category two",
          slug: slugify("category two"),
        },
        {
          name: "category three",
          slug: slugify("category three"),
        },
      ];

      categoryModel.find = jest.fn().mockResolvedValueOnce(categories);

      await categoryControlller(req, res);

      expect(categoryModel.find).toBeCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: categories,
      });
    });
  });

  describe("Given an unexpected error during querying", () => {
    test("Returns message that an error occurred while getting all categories", async () => {
      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.find = jest.fn().mockRejectedValueOnce(unexpectedError);

      await categoryControlller(req, res);

      expect(categoryModel.find).toBeCalledWith({});
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "Error while getting all categories",
      });
    });
  });
});

describe("For Single Category Controller", () => {
  beforeEach(() => {
    req = {
      params: {
        slug: slugify("single category"),
      },
    };
  });

  describe("Given an existing slug", () => {
    test("Returns the matching category and the associated message", async () => {
      let category = {
        name: "single category",
        slug: slugify("single category"),
      };

      categoryModel.findOne = jest.fn().mockResolvedValueOnce(category);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledWith({
        slug: slugify("single category"),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category: category,
      });
    });
  });

  describe("Given an unexpected error during querying", () => {
    test("Returns message that an error occurred while getting single category", async () => {
      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.findOne = jest.fn().mockRejectedValueOnce(unexpectedError);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toBeCalledWith({
        slug: slugify("single category"),
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "Error While getting Single Category",
      });
    });
  });
});

describe("For Delete Category Controller", () => {
  beforeEach(() => {
    req = {
      params: {
        id: "1",
      },
    };
  });

  describe("Given an existing id", () => {
    test("Deletes the matching category and returns the associated message", async () => {
      categoryModel.findByIdAndDelete = jest.fn().mockResolvedValueOnce();

      await deleteCategoryCOntroller(req, res);

      expect(categoryModel.findByIdAndDelete).toBeCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });
  });

  describe("Given an unexpected error during deletion", () => {
    test("Returns message that an error occurred while deleting category", async () => {
      let unexpectedError = new Error("An unexpected error occurred");
      categoryModel.findByIdAndDelete = jest
        .fn()
        .mockRejectedValueOnce(unexpectedError);

      await deleteCategoryCOntroller(req, res);

      expect(categoryModel.findByIdAndDelete).toBeCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: unexpectedError,
        message: "error while deleting category",
      });
    });
  });
});
