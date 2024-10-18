import { UserBuilder } from "./testutils/user/userbuilder";
import { ProductBuilder } from "./testutils/product/productBuilder";
import { ObjectId } from "mongodb";
import { hashPassword } from "./helpers/authHelper";
import categoryModel from "./models/categoryModel";
import productModel from "./models/productModel";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testUserModel = new UserBuilder()
  .withEmail("TestUser@example.com")
  .withName("Test User")
  .withAnswer("Football")
  .withAddress("Test Address")
  .withPhone("13090434")
  .withPassword("test123")
  .withRole(0)
  .buildUserModel();

const categories = [
  {
    _id: new ObjectId(),
    name: "Category One",
    slug: "category-one",
  },
  {
    _id: new ObjectId(),
    name: "Category Two",
    slug: "category-two",
  },
];

const products = [
  new ProductBuilder()
    .withCategory(categories[0]._id)
    .withId(new ObjectId())
    .withName("Product One")
    .withSlug("product-one")
    .withPrice(10)
    .withImage({data: ""})
    .withDescription("This is product 1")
    .build(),
  new ProductBuilder()
    .withCategory(categories[0]._id)
    .withId(new ObjectId())
    .withName("Product Two")
    .withSlug("product-two")
    .withPrice(20)
    .withImage({data :"" })
    .withDescription("This is product 2")
    .build(),
  new ProductBuilder()
    .withCategory(categories[0]._id)
    .withId(new ObjectId())
    .withName("Product Three")
    .withSlug("product-three")
    .withPrice(30)
    .withImage({data :""})
    .withDescription("This is product 3")
    .build(),
];

async function globalSetup() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    testUserModel.password = await hashPassword(testUserModel.password);
    await testUserModel.save();
    await categoryModel.insertMany(categories);
    await productModel.insertMany(products);
    await mongoose.connection.close();
  } catch (error) {
    console.log(`Error in Mongodb ${error}`);
  }
};

export default globalSetup;