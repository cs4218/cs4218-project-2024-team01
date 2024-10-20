import userModel from "./models/userModel";
import categoryModel from "./models/categoryModel";
import productModel from "./models/productModel";
import orderModel from "./models/orderModel";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function globalTeardown() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const user = await userModel.findOne({ email: "TestUser@example.com" });
    await userModel.deleteOne({ email: "TestUser@example.com" });
    await categoryModel.deleteMany({ slug: { $in: ['category-one', 'category-two'] } });
    await productModel.deleteMany({ slug: { $in: ['product-one', 'product-two', 'product-three'] } });
    await orderModel.deleteMany({ buyer: user._id });
    await mongoose.connection.close();
  } catch (error) {
    console.log(`Error in Mongodb ${error}`);
  }
};

export default globalTeardown;