import { afterAll, beforeAll, describe } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { UserBuilder } from "../testutils/user/userbuilder.js";

let mongoServer;
let userbuilder = new UserBuilder();
let mockedUserModel = userbuilder.buildUserModel();
let mockedUserObj = userbuilder.build();
describe("User Model Integration with MongoDB", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(process.env.MONGO_URL);
  })

  const collectionName = "intTestUsers";
  beforeEach(async () => {
    await mongoose.connection.db.dropCollection(collectionName);
    await mongoose.connection.db.createCollection(collectionName);
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
  })

  test("Insertion of newly created user into MongoDB", async () => {
    const newUserCreated = await mockedUserModel.save();

    expect(newUserCreated._id).toBeDefined();
    expect(newUserCreated.name).toBe(mockedUserObj.name);
    expect(newUserCreated.email).toBe(mockedUserObj.email);
    expect(newUserCreated.password).toBe(mockedUserObj.password);
    expect(newUserCreated.phone).toBe(mockedUserObj.phone);
    expect(newUserCreated.address).toBe(mockedUserObj.address);
    expect(newUserCreated.answer).toBe(mockedUserObj.answer);
  })
})