import { UserBuilder } from "./testutils/user/userbuilder.js";
import { ProductBuilder } from "./testutils/product/productBuilder.js";
import { ObjectId } from "mongodb";
import { hashPassword } from "./helpers/authHelper.js";
import userModel from "./models/userModel.js";
import categoryModel from "./models/categoryModel.js";
import productModel from "./models/productModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import orderModel from "./models/orderModel.js";
import { OrderBuilder } from "./testutils/order/orderbuilder.js";


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

const testUserModel2 = new UserBuilder()
  .withID(new ObjectId())
  .withEmail("TestUser2@example.com")
  .withName("Test User 2")
  .withAnswer("Basketball")
  .withAddress("Test Address 2")
  .withPhone("12345678")
  .withPassword("test123")
  .withRole(0)
  .buildUserModel();

const testUserModel3 = new UserBuilder()
  .withID(new ObjectId())
  .withEmail("TestUser3@example.com")
  .withName("Test User 3")
  .withAnswer("Baseball")
  .withAddress("Test Address 3")
  .withPhone("12345678")
  .withPassword("test123")
  .withRole(0)
  .buildUserModel();

const testAdminUserModel = new UserBuilder()
  .withID(new ObjectId())
  .withEmail("admin@admin.com")
  .withName("Admin")
  .withAnswer("Football")
  .withAddress("Test Address")
  .withPhone("13090434")
  .withPassword("test123")
  .withRole(1)
  .buildUserModel();

const answer = 'Football';
const testUserDarrenJames = new UserBuilder().withID(new ObjectId()).withEmail('DarrenJames@test.com')
  .withName('Darren James').withAnswer(answer).withAddress('123 Street')
  .withPhone('1234567890').withRole(0).withPassword('darrenjames123')
  .buildUserModel();

const testUserMaryJane = new UserBuilder().withID(new ObjectId()).withEmail('MaryJane@test.com')
  .withName('Mary Jane').withAnswer('Football').withAddress('123 Street')
  .withPhone('1234567890').withRole(0).withPassword('maryjane123')
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
    .withImage({ data: "" })
    .withDescription("This is product 1")
    .build(),
  new ProductBuilder()
    .withCategory(categories[0]._id)
    .withId(new ObjectId())
    .withName("Product Two")
    .withSlug("product-two")
    .withPrice(20)
    .withImage({ data: "" })
    .withDescription("This is product 2")
    .build(),
  new ProductBuilder()
    .withCategory(categories[0]._id)
    .withId(new ObjectId())
    .withName("Product Three")
    .withSlug("product-three")
    .withPrice(30)
    .withImage({ data: "" })
    .withDescription("This is product 3")
    .build(),
];

const orders = [
  new OrderBuilder()
    .withId(new ObjectId())
    .withBuyer(testUserModel3._id)
    .withStatus("Not Process")
    .withPayment({ success: true })
    .withProducts([
      products[2]._id,
    ])
    .build(),
];


async function globalSetup() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    testUserModel.password = await hashPassword(testUserModel.password);
    testUserModel2.password = await hashPassword(testUserModel2.password);
    testUserModel3.password = await hashPassword(testUserModel3.password);
    testAdminUserModel.password = await hashPassword(testAdminUserModel.password);
    testUserDarrenJames.password = await hashPassword(testUserDarrenJames.password);
    testUserMaryJane.password = await hashPassword(testUserMaryJane.password);

    await userModel.insertMany([testUserModel, testUserModel2, testUserModel3, testAdminUserModel, testUserDarrenJames, testUserMaryJane]);
    await categoryModel.insertMany(categories);
    await productModel.insertMany(products);
    await orderModel.insertMany(orders);
    await mongoose.connection.close();
  } catch (error) {
    console.log(`Error in Mongodb ${error}`);
  }
};

export default globalSetup;