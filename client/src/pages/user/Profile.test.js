import React from "react";
import { beforeEach, describe, jest, expect, it} from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import Profile from "./Profile";
import axios from 'axios';
import toast from "react-hot-toast";

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock("../../components/Layout", () => ({ title, children }) => (
    <>
      <div>{title}</div>
      <div>{children}</div>
    </>
  )
);

let mockUser = {
    user: {
        name: "John Doe",
        email: "johndoe@gmail.com",
        password: "password123",
        phone: "123456789",
        address: "123 Woodlands Avenue 6"
    }
};

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [mockUser, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(() => JSON.stringify({ user: mockUser.user })),
        removeItem: jest.fn(),
    },
    writable: true,
});

describe("Profile Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render the Profile components", () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText("USER PROFILE")).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Name').value).toBe(mockUser.user.name);
        expect(getByPlaceholderText('Enter Your Email').value).toBe(mockUser.user.email);
        expect(getByPlaceholderText('Enter Your Phone').value).toBe(mockUser.user.phone);
        expect(getByPlaceholderText('Enter Your Address').value).toBe(mockUser.user.address);
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();

    });

    it("should update the full profile successfully", async () => {

        let updatedMockUser = {
            name: "Jane Doe",
            email: "janedoe@gmail.com",
            password: "passw0rd1",
            phone: "987654321",
            address: "456 Jurong Street 61"
        }

        axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                message: "Profile Updated SUccessfully",
                updatedUser: updatedMockUser
            }
        });

        localStorage.getItem.mockReturnValueOnce(JSON.stringify({
            user: mockUser.user,
        }));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Name'), {
            target: { value: updatedMockUser.name }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), {
            target: { value: updatedMockUser.email }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
            target: { value: updatedMockUser.phone }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), {
            target: { value: updatedMockUser.address }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {
            target: { value: updatedMockUser.password }
        });
        fireEvent.click(getByText('UPDATE'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updatedMockUser);
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    });

    it("should update the name, password and address of the user successfully", async () => {
        let updatedMockUser = {
            name: "Jane Doe",
            email: mockUser.user.email,
            password: "passw0rd1",
            phone: mockUser.user.phone,
            address: "456 Jurong Street 61"
        }

        axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                message: "Profile Updated SUccessfully",
                updatedUser: updatedMockUser
            }
        });

        localStorage.getItem.mockReturnValueOnce(JSON.stringify({
            user: mockUser.user,
        }));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Name'), {
            target: { value: updatedMockUser.name }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), {
            target: { value: updatedMockUser.address }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {
            target: { value: updatedMockUser.password }
        });
        fireEvent.click(getByText('UPDATE'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updatedMockUser);
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    });

    it("should update the email and phone of the user successfully", async () => {
        let updatedMockUser = {
            name: mockUser.user.name,
            email: "janedoe@gmail.com",
            password: "",
            phone: "987654321",
            address: mockUser.user.address
        }

        axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                message: "Profile Updated SUccessfully",
                updatedUser: updatedMockUser
            }
        });

        localStorage.getItem.mockReturnValueOnce(JSON.stringify({
            user: mockUser.user,
        }));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), {
            target: { value: updatedMockUser.email }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
            target: { value: updatedMockUser.phone }
        });
        fireEvent.click(getByText('UPDATE'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updatedMockUser);
        });

        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    });


    it("should display error when there is an error in updating the form", async () => {
        let updatedMockUser = {
            name: "Jane Doe",
            email: "janedoe@gmail.com",
            password: "passw0rd1",
            phone: "987654321",
            address: "456 Jurong Street 61"
        }

        axios.put.mockRejectedValueOnce({
            data: {
                success: false,
                message: "Error WHile Geting Orders",
                
            }
        });

        localStorage.getItem.mockImplementationOnce(() => {
            throw new Error("Failed to get item");
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Name'), {
            target: { value: "Jane Doe" }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), {
            target: { value: "janedoe@gmail.com" }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
            target: { value: "987654321" }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), {
            target: { value: "456 Jurong Street 61" }
        });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {
            target: { value: "passw0rd1" }
        });
        fireEvent.click(getByText('UPDATE'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updatedMockUser);
        });

        expect(toast.error).toHaveBeenCalledWith("Something went wrong");

    });
    
    it("should display error when there is error from API", async () => {
            
        let updatedMockUser = {
            name: "John Doe",
            email: "johndoe@gmail.com",
            password: "passw",
            phone: "123456789",
            address: "123 Woodlands Avenue 6"
        }

        axios.put.mockResolvedValue({
            data: {
                error: "Password is required and 6 character long"
            }
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard/user/profile" element={<Profile />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Password'), {
            target: { value: "passw" }
        });

        fireEvent.click(getByText('UPDATE'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", updatedMockUser);
        });

        expect(toast.error).toHaveBeenCalledWith("Password is required and 6 character long");

        // Does not display error message when it is available

    });

});

