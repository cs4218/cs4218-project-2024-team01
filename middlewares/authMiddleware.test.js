import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {UserBuilder} from "../testutils/user/userbuilder.js";
import {isAdmin, requireSignIn} from "./authMiddleware.js";
import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { afterEach } from "node:test";

let res;
let req;
let next;
const initializeRequestResponse = () => {
	req = {
		user: new UserBuilder().build(),
		headers: {
			authorization: 'token'
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
	afterEach(() => {
		next.mockRestore()
	})
	describe("Request routed to requireSignIn",  () => {
		describe("Jwt Valid",  () => {
			test("Routed to protected route", async () => {
				let decodedUser = new UserBuilder().build()
				jest.spyOn(jsonwebtoken, 'verify').mockReturnValueOnce(decodedUser)
				
				await requireSignIn(req, res, next)
				
				expect(req.user).toEqual(decodedUser)
				expect(next).toHaveBeenCalledTimes(1)
			})
		})
		describe("Jwt invalid", () => {
			test("Returns 403 UnAuthorized Access", async () => {
				jest.spyOn(jsonwebtoken, 'verify').mockImplementationOnce(() => { throw new Error('Failed to decode JWT token'); });
				const consoleLog = jest.spyOn(console, 'log');
				
				await requireSignIn(req, res, next)
				
				expect(next).not.toHaveBeenCalled()
				expect(consoleLog).toHaveBeenCalledWith(new Error('Failed to decode JWT token'))
				expect(res.status).toHaveBeenCalledWith(403)
				expect(res.send).toHaveBeenCalledWith({
					success: false,
					message: "UnAuthorized Access",
				})
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