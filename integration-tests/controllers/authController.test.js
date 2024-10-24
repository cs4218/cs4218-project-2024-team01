import { beforeEach, describe, expect, test, it, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../../testutils/user/userbuilder";
import { comparePassword, hashPassword } from "../../helpers/authHelper";
import { UserBuilder } from "../../testutils/user/userbuilder";
import { loginController, registerController, forgotPasswordController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController} from "../../controllers/authController";
import mongoose, { Types } from "mongoose";
import userModel from "../../models/userModel";
import orderModel from "../../models/orderModel";
import productModel from "../../models/productModel";
import categoryModel from "../../models/categoryModel";

let mongoServer;
let userbuilder = new UserBuilder();
let mockedUserModel = userbuilder.buildUserModel();

describe("Register Controller", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(mongoServer.getUri());
  })

  const collectionName = "users";
  beforeEach(async () => {
    await mongoose.connection.db.dropCollection(collectionName);
    await mongoose.connection.db.createCollection(collectionName);
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  })

  describe("New user registers for an account with valid inputs and email does not exist in database", () => {
    const req = {
      body: userbuilder.build(),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User created successfully and saved in database", async () => {
      await registerController(req, res);

      let insertedUser = await userModel.findOne({ email: req.body.email });
      expect(insertedUser).not.toBeNull();
      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.send).toHaveBeenCalled()
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("User Register Successfully");
      expect(responseArgs.user.email).toBe(insertedUser.email)
      expect(responseArgs.user._id).toStrictEqual(insertedUser._id)
    });
  });

  describe("Existing user registers for an account with valid inputs and email exists in database", () => {
    const req = {
      body: userbuilder.build(),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User not created and not saved in database", async () => {
      await mockedUserModel.save()

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.send).toHaveBeenCalled()
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.message).toBe("Already Register please login");
    })
  })

  describe("Receives invalid form", () => {
    const req = {
      body: new UserBuilder().withEmail(null).build(),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User not created and not saved in database", async () => {
      await registerController(req, res);

      let insertedUser = await userModel.findOne({ email: req.body.email });
      expect(insertedUser).toBeNull();

      expect(res.send).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toBe("Email is Required")
    })
  })

  describe("Database Error", () => {
    const req = { body: userbuilder.build() };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    test("User not created and not saved in database", async () => {
      jest.spyOn(userModel, "findOne").mockImplementation(() => {
        throw new Error("Error");
      });
      await registerController(req, res);

      // userModel is mocked, hence to get the inserted user we need to query the database
      let insertedUser = await mongoose.connection.db.collection(collectionName).findOne({ email: req.body.email });
      expect(insertedUser).toBeNull();

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(new Error("Error"));
    })
  })
})

describe("Login Controller", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(process.env.MONGO_URL);
  })

  const collectionName = "users";
  beforeEach(async () => {
    jest.restoreAllMocks();
    await mongoose.connection.db.dropCollection(collectionName);
    await mongoose.connection.db.createCollection(collectionName);
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
  })

  describe("Receives valid login form", () => {
    let email = "test123@example.com";
    let password = "password123";
    const req = {
      body: {
        email,
        password
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User logged in successfully", async () => {
      const registeredUser = new UserBuilder().withEmail(email).withPassword(password).buildUserModel();
      registeredUser.password = await hashPassword(password);
      await registeredUser.save();
      process.env.JWT_SECRET = "secret123";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("login successfully");
      expect(responseArgs.user).not.toBeNull();
      expect(responseArgs.token).not.toBeNull();
    });
  })

  describe("Receives invalid login form: wrong password", () => {
    let email = "test123@example.com";
    let password = "password123";
    let req = {
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User not logged in", async () => {
      req.body = {
        email,
        password: password + "wrong"
      }
      const registeredUser = new UserBuilder().withEmail(email).withPassword(password).buildUserModel();
      registeredUser.password = await hashPassword(password);
      await registeredUser.save();
      process.env.JWT_SECRET = "secret123";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.message).toBe("Invalid Password");
    });
  })

  describe("Receives invalid login form: wrong email", () => {
    let email = "test123@example.com";
    let password = "password123";
    let req = {
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("User not logged in", async () => {
      req.body = {
        email: email + "wrong",
        password
      }
      const registeredUser = new UserBuilder().withEmail(email).withPassword(password).buildUserModel();
      registeredUser.password = await hashPassword(password);
      await registeredUser.save();
      process.env.JWT_SECRET = "secret123";

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.message).toBe("Email is not registered");
    });
  })

  describe("Database Error", () => {
    const req = { body: {
      email: "test123@example.com",
      password: "password123"
    } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    test("User not logged in", async () => {
      jest.spyOn(userModel, "findOne").mockImplementation(() => {
        throw new Error("Error");
      });

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.error).toStrictEqual(new Error("Error"));
    })
  })
})

describe("Forgot Password Controller", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(process.env.MONGO_URL);
  })

  const collectionName = "users";
  beforeEach(async () => {
    jest.restoreAllMocks();
    await mongoose.connection.db.dropCollection(collectionName);
    await mongoose.connection.db.createCollection(collectionName);
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
  })

  describe("Receives valid email", () => {
    let email = "test123@example.com";
    let answer = "answer";
    let newPassword = "newPassword123";
    const req = {
      body: {
        email,
        answer,
        newPassword
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("Password changed successfully", async () => {
      const registeredUser = new UserBuilder().withEmail(email)
      .withPassword("password123").withAnswer(answer).buildUserModel();
      registeredUser.password = await hashPassword("password123");
      await registeredUser.save();
      process.env.JWT_SECRET = "secret123";

      await forgotPasswordController(req, res);

      let user = await userModel.findOne({ email });
      expect(await comparePassword(newPassword, user.password)).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(true);
      expect(responseArgs.message).toBe("Password Reset Successfully");
    })
  })

  describe("Receives invalid email", () => {
    let email = "test123@example.com";
    let answer = "answer";
    let newPassword = "newPassword123";
    const req = {
      body: {
        email: email + "wrong",
        answer,
        newPassword
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    test("Password not changed", async () => {
      const registeredUser = new UserBuilder().withEmail(email).withPassword("password123").buildUserModel();
      registeredUser.password = await hashPassword("password123");
      await registeredUser.save();
      process.env.JWT_SECRET = "secret123";

      await forgotPasswordController(req, res);

      let user = await userModel.findOne({ email });
      expect(await comparePassword(newPassword, user.password)).toBe(false);
      expect(res.status).toHaveBeenCalledWith(404);
      const responseArgs = res.send.mock.calls[0][0];
      expect(responseArgs.success).toBe(false);
      expect(responseArgs.message).toBe("Wrong Email Or Answer");
    })
  })
})
describe("Get All Orders Controller", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("users");
        await mongoose.connection.db.dropCollection("orders");
        await mongoose.connection.db.dropCollection("products");
        await mongoose.connection.db.dropCollection("categories");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Get all orders available", () => {
        const existingUser1 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 1")
            .withEmail("testuser1@gmail.com")
            .buildUserModel();

        const existingUser2 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 2")
            .withEmail("testuser2@gmail.com")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test Category",
            slug: "test-category",
            _id: new Types.ObjectId(),
        });

        const existingProduct = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 1",
            slug: "test-product-1",
            price: 10,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const order1 = new orderModel({
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser1._id,
            status: "Not Process",
            createdAt: new Date("2024-01-01T00:00:00Z"),
        });

        const order2 = new orderModel({
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser2._id,
            status: "Not Process",
            createdAt: new Date("2024-02-01T00:00:00Z"),
        });

        const req = {};

        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should get all orders and sort by createdAt in descending order", async () => {
            await existingUser1.save();
            await existingUser2.save();
            await existingCategory.save();
            await existingProduct.save();
            await order1.save();
            await order2.save();

            await getAllOrdersController(req, res);

            expect(res.json).toHaveBeenCalled();

            const resArgs = res.json.mock.calls[0][0];

            expect(resArgs.length).toBe(2);

            // Ensure sorting is correct
            expect(resArgs[0].createdAt).toBe(order2.createdAt.toISOString());
            expect(resArgs[1].createdAt).toBe(order1.createdAt.toISOString());

            // Check that buyer is populated correctly
            expect(resArgs[0].buyer.name).toBe(existingUser2.name);
            expect(resArgs[1].buyer.name).toBe(existingUser1.name);

            // Check that products are populated correctly
            expect(resArgs[0].products[0].name).toBe(existingProduct.name);
            expect(resArgs[1].products[0].name).toBe(existingProduct.name);
        });

        it("should handle database error and return a 500 status", async () => {
            jest.spyOn(orderModel, 'find').mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            await getAllOrdersController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error WHile Geting Orders",
                error: expect.anything(),
            });
        });
    });
});

describe("Order Status Controller", () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("orders");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Update order status", () => {
        const existingUser1 = new UserBuilder()
            .withID(new Types.ObjectId())
            .withName("Test User 1")
            .withEmail("testuser1@gmail.com")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test Category",
            slug: "test-category",
            _id: new Types.ObjectId(),
        });

        const existingProduct = new productModel({
            _id: new Types.ObjectId(),
            name: "Test Product 1",
            slug: "test-product-1",
            price: 10,
            description: "Test product description",
            category: existingCategory._id,
            quantity: 10,
            shipping: true,
        });

        const existingOrder = new orderModel({
            _id: new Types.ObjectId(),
            products: [existingProduct._id],
            payment: {},
            buyer: existingUser1._id,
            status: "Not Process",
        });

        const req = {
            params: { orderId: existingOrder._id },
            body: { status: "Shipped" },
        };

        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should update the order status successfully", async () => {
            await existingUser1.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            await orderStatusController(req, res);

            expect(res.json).toHaveBeenCalled();
            const resArgs = res.json.mock.calls[0][0];
            expect(resArgs.status).toBe("Shipped");
        });

        it("should handle database error and return a 500 status", async () => {
            jest.spyOn(orderModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            await orderStatusController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updateing Order",
                error: expect.anything(),
            });
        });
    });
});

describe("Update Profile Controller", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });
    
    const collectionName = "users";

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection(collectionName);
        await mongoose.connection.db.createCollection(collectionName);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("User update his profile with valid fields" , () => {

        const updatedUser = new UserBuilder()
            .withName("Test User 124")
            .withEmail("test124@example.com")
            .withPhone("90000124")
            .withAddress("Test Address 678")
            .withPassword("passw0rd123")
            .build();
        
        const req = {
            user: {
                _id: mockedUserModel._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should update user profile in the database", async () => {
            
            mockedUserModel.password = await hashPassword(mockedUserModel.password);
            await mockedUserModel.save();

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(true);
            expect(resArgs.message).toBe("Profile Updated SUccessfully");
            expect(resArgs.updatedUser.name).toBe(updatedUser.name);
            expect(resArgs.updatedUser.phone).toBe(updatedUser.phone);
            expect(resArgs.updatedUser.address).toBe(updatedUser.address);

            const isPasswordMatch = await comparePassword(updatedUser.password, resArgs.updatedUser.password);
            expect(isPasswordMatch).toBe(true);

            expect(resArgs.updatedUser.email).toBe(updatedUser.email);

        });
    });

    describe("User update his profile with invalid password length" , () => {

        const existingUser = new UserBuilder()
            .withID("60f1b1b3b3b3bd83aab1b3c2")
            .buildUserModel();

        const updatedUser = new UserBuilder()  
            .withPassword("passw")
            .build();

        const req = {
            user: {
                _id: existingUser._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not update user profile in the database", async () => {
            
            existingUser.password = await hashPassword(existingUser.password);
            await existingUser.save();

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Update profile");
            expect(resArgs.error).toBeDefined();

        });

    });

    describe("Database error while updating user profile" , () => {

        const existingUser = new UserBuilder()
            .withID("81f14de12b3bd4a3aab1b3c2")
            .buildUserModel();

        const updatedUser = new UserBuilder()
            .withName("Test User 124")
            .withPhone("90000124")
            .build();
        
        const req = {
            user: {
                _id: existingUser._id
            },
            body: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                password: updatedUser.password
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not update user profile in the database", async () => {
                
            existingUser.password = await hashPassword(existingUser.password);
            await existingUser.save();

            jest.spyOn(userModel, "findById").mockImplementation(() => {
                throw new Error("Database Error");
            });

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];
            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Update profile");
            expect(resArgs.error).toStrictEqual(new Error("Database Error"));

            // Check to see if the user is not updated in the database
            const user = await userModel.find({ _id: existingUser._id });
            expect(user.name).not.toBe(updatedUser.name);
            expect(user.phone).not.toBe(updatedUser.phone);

    
        });
    });

});

describe("Get Orders Controller", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await mongoose.connect(mongoServer.getUri());
    });
    

    beforeEach(async () => {
        jest.clearAllMocks();
        await mongoose.connection.db.dropCollection("users");
        await mongoose.connection.db.createCollection("users");
        await mongoose.connection.db.dropCollection("orders");
        await mongoose.connection.db.createCollection("orders");
        await mongoose.connection.db.dropCollection("products");
        await mongoose.connection.db.createCollection("products");
        await mongoose.connection.db.dropCollection("categories");
        await mongoose.connection.db.createCollection("categories");
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("Get orders of a user" , () => {

        const existingUser = new UserBuilder()
            .withID("7e3b5d1a8f4c2b9d6a7c0e1f")
            .buildUserModel();

        const existingCategory = new categoryModel({
            name: "Test",
            slug: "test",
            _id: "3d8f6b2a9c4e1b7f5a2c8d7e"
        });

        const existingProduct = new productModel({
                _id: "9a4f7e2d8c5b1f3e7d4a2b9c",
                name: "test",
                slug: "test",
                price: 100,
                description: "test description",
                category: "3d8f6b2a9c4e1b7f5a2c8d7e",
                quantity: 10, 
                shipping: true,
        });

        const existingOrder = new orderModel({
            products: [
                "9a4f7e2d8c5b1f3e7d4a2b9c",
            ],
            payment: {},
            buyer: "7e3b5d1a8f4c2b9d6a7c0e1f",
            status: 'Not Process'
        });

        const req = {
            user: {
                _id: "7e3b5d1a8f4c2b9d6a7c0e1f"
            }
        };
    
        const res = {
            json: jest.fn(),
        };

        it("should get orders of a user from the database", async () => {

            await existingUser.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            await getOrdersController(req, res);

            expect(res.json).toHaveBeenCalled();

            const resArgs = res.json.mock.calls[0][0];

            expect(resArgs[0].status).toBe(existingOrder.status);
            
            // Expect buyer to be populated correctly
            expect(resArgs[0].buyer.name).toBe(existingUser.name);
            expect(resArgs[0].buyer._id).toStrictEqual(existingUser._id);

            // Expect products to be populated correctly
            expect(resArgs[0].products[0].name).toBe(existingProduct.name);
            expect(resArgs[0].products[0].slug).toBe(existingProduct.slug);
            expect(resArgs[0].products[0].price).toBe(existingProduct.price);
            expect(resArgs[0].products[0].description).toBe(existingProduct.description);
            expect(resArgs[0].products[0].quantity).toBe(existingProduct.quantity);
            expect(resArgs[0].products[0].shipping).toBe(existingProduct.shipping);

        });


    });

    describe("Database error while getting orders of a user" , () => {

        const existingUser = new UserBuilder()
            .withID("2a9f3e7d4b6c1f8d5e0a3b7c")
            .buildUserModel();

        

        const existingCategory = new categoryModel({
            name: "Test",
            slug: "test",
            _id: "8c2f7a4d1b5e9d3c6b0e4f1a"
        });

        const existingProduct = new productModel({
                _id: "5b3e1d8a7c9f4a2e6d0b3f9c",
                name: "test",
                slug: "test",
                price: 100,
                description: "test description",
                category: "8c2f7a4d1b5e9d3c6b0e4f1a",
                quantity: 10, 
                shipping: true,
        });

        const existingOrder = new orderModel({
            products: [
                "5b3e1d8a7c9f4a2e6d0b3f9c",
            ],
            payment: {},
            buyer: "2a9f3e7d4b6c1f8d5e0a3b7c",
            status: 'Not Process'
        });

        const req = {
            user: {
                _id: "2a9f3e7d4b6c1f8d5e0a3b7c" 
            }
        };
    
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        it("should not get orders of a user from the database", async () => {

            await existingUser.save();
            await existingCategory.save();
            await existingProduct.save();
            await existingOrder.save();

            jest.spyOn(orderModel, "find").mockImplementation(() => {
                throw new Error("Database Error");
            });

            await getOrdersController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();

            const resArgs = res.send.mock.calls[0][0];

            expect(resArgs.success).toBe(false);
            expect(resArgs.message).toBe("Error WHile Geting Orders");
            expect(resArgs.error).toStrictEqual(new Error("Database Error"));

        });


    });

});
