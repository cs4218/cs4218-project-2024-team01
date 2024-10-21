import userModel from "./models/userModel.js";
import categoryModel from "./models/categoryModel.js";
import productModel from "./models/productModel.js";
import orderModel from "./models/orderModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function globalTeardown() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const user = await userModel.findOne({ email: "TestUser@example.com" });
    const admin = await userModel.findOne({ email: "admin@admin.com" });
    await userModel.deleteOne({ email: "TestUser@example.com" });
    await userModel.deleteOne({ email: "admin@admin.com" });
    await categoryModel.deleteMany({ slug: { $in: ['category-one', 'category-two', 'category-three'] } });
    await productModel.deleteMany({ slug: { $in: ['product-one', 'product-two', 'product-three', 'Product-Four'] } });
    await orderModel.deleteMany({ buyer: user._id });
    await mongoose.connection.close();
  } catch (error) {
    console.log(`Error in Mongodb ${error}`);
  }
};

export default globalTeardown;