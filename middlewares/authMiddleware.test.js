import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {UserBuilder} from "../testutils/user/userbuilder.js";
import {isAdmin, requireSignIn} from "./authMiddleware.js";
import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/userModel.js";

let res;
let req;
let next;
const initializeRequestResponse = () => {
	req = {
		user: new UserBuilder().build(),
		headers: {
			authorization: {}
		}
	}
	res = {
		send: jest.fn(),
		status: jest.fn().mockReturnThis()
	}
	next = jest.fn().mockReturnThis()
	
	jest.clearAllMocks()
}

describe("Given that the authMiddleware is called", () => {
	beforeEach(() => initializeRequestResponse())
	describe("Request routed to requireSignIn",  () => {
		describe("Jwt Valid",  () => {
			test("Routed to protected route", async () => {
				let decodedUser = new UserBuilder().build()
				jest.spyOn(jsonwebtoken, 'verify').mockResolvedValueOnce(decodedUser)
				
				await requireSignIn(req, res, next)
				
				expect(req.user).toBe(decodedUser)
				expect(next).toHaveBeenCalledTimes(1)
			})
		})
		describe("Jwt invalid", () => {
			test("Returns 403 UnAuthorized Access", async () => {
				JWT.verify = jest.fn().mockRejectedValueOnce(new jsonwebtoken.JsonWebTokenError("Failed to decode JWT token"))
				const consoleLog = jest.spyOn(console, 'log');
				
				await requireSignIn(req, res, next)
				
				expect(res.status).toHaveBeenCalledWith(403)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "UnAuthorized Access",
				})
				expect(next).toHaveBeenCalledTimes(0)
				expect(consoleLog).toHaveBeenCalledWith(new JsonWebTokenError("Failed to decode JWT token"))
			})
		})
	})
	
	describe("Request routed to isAdmin", () => {
		describe("User not admin", () => {
			test("Returns 403 UnAuthorized Access", async () => {
				let nonAdminUser = new UserBuilder().build()
				userModel.findById = jest.fn().mockResolvedValueOnce(nonAdminUser)
				
				await isAdmin(req, res, next)
				
				expect(res.status).toHaveBeenCalledWith(403)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "UnAuthorized Access",
				})
			})
		})
		describe("User is admin", () => {
			test("Admin user allowed to access protected route", async () => {
				let adminUser = new UserBuilder().withRole(1).build()
				userModel.findById = jest.fn().mockResolvedValueOnce(adminUser)
				
				await isAdmin(req, res, next)
				
				expect(next).toHaveBeenCalledTimes(1)
			})
		})
		describe("Error in dependencies", () => {
			test("Returns 500 Error", async () => {
				userModel.findById = jest.fn().mockRejectedValueOnce(new Error("Connection Failed"))
				
				await isAdmin(req, res, next)
				
				expect(next).toHaveBeenCalledTimes(0)
				expect(res.status).toHaveBeenCalledWith(500)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "Connection Failed",
				})
			})
		})
	})
})