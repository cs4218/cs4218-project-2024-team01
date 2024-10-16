import { beforeEach, describe, expect, test, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../../testutils/user/userbuilder";
import userModel from "../../models/userModel";
import { loginController, registerController, forgotPasswordController } from "../../controllers/authController";
import { comparePassword, hashPassword } from "../../helpers/authHelper";

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