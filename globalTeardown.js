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
    const user2 = await userModel.findOne({ email: "TestUser2@example.com" });
    const user3 = await userModel.findOne({ email: "TestUser3@example.com" });
    await userModel.deleteMany({ email: 
      { 
        $in: ["TestUser@example.com", "TestUser2@example.com", "TestUser3@example.com",  "admin@admin.com", "DarrenJames@test.com", "MaryJane@test.com"] 
      }});
    await categoryModel.deleteMany({ slug: { $in: ['category-one', 'category-two', 'category-three', 'category-four'] }});
    await productModel.deleteMany({ slug: { $in: ['product-one', 'product-two', 'product-three', 'Product-Four'] }});
    await orderModel.deleteMany({ buyer: { $in: [user2._id, user3._id] }});
    await mongoose.connection.close();
  } catch (error) {
    console.log(`Error in Mongodb ${error}`);
  }
};

export default globalTeardown;