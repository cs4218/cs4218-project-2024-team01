import React from "react";
import { beforeEach, describe, jest, expect, it} from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import Orders from "./Orders";
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
    },
    token: "mockToken"
};

let mockProducts = [
    {
        name: "Iphone 16 Pro",
        slug: "iphone-16-pro",
        description: "This is the newest Iphone from Apple that you can buy with Apple Intelligence, better chip, longer battery life and Camera Control.",
        price: 1500,
        category: {name: "Electronics", slug: "electronics"},
        quantity: 200,
        photo: {
            data: null,
            contentType: "image/png"
        },
        shipping: true
    },
    {
        name: "Dynamo Detergent",
        slug: "dynamo-detergent",
        description: "Dynamo Detergent 1.5L",
        price: 14,
        category: {name: "Household", slug: "household"},
        quantity: 50,
        photo: {
            data: null,
            contentType: "image/png"
        },
        shipping: true
    },
    {
        name: "Nike Air Max",
        slug: "nike-air-max",
        description: "The new Nike Air Max 2024 Latest Edition",
        price: 399,
        category: {name: "Fashion", slug: "fashion"},
        quantity: 100,
        photo: {
            data: null,
            contentType: "image/png"
        },
        shipping: true
    }
]

let mockOrders = {
    orders: [
        {
            status: "Not processed",
            buyer: mockUser.user,
            createdAt: new Date("2024-08-31T12:11:00.000Z"),
            payment: {
                success: true
            },
            products:[
                mockProducts[0],
                mockProducts[1],
                mockProducts[2]
            ]
        }
    ]
};

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [mockUser, jest.fn()])
}));

describe("Orders Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render the Orders components if there is order from user", async () => {

        axios.get.mockResolvedValueOnce({
            data: mockOrders.orders
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
                <Routes>
                    <Route path="/dashboard/user/orders" element={<Orders />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText("All Orders")).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
            const rows = screen.getAllByRole("row");
            expect(rows).toHaveLength(2);
            
            expect(getByText("Not processed")).toBeInTheDocument();
            expect(getByText(mockUser.user.name)).toBeInTheDocument();
            expect(getByText("a few seconds ago")).toBeInTheDocument();
            expect(getByText("Success")).toBeInTheDocument();
            expect(getByText("3")).toBeInTheDocument();

            expect(getByText("Iphone 16 Pro")).toBeInTheDocument();
            expect(getByText("This is the newest Iphone from")).toBeInTheDocument();
            expect(getByText("Price : 1500")).toBeInTheDocument();
            expect(getByText("Dynamo Detergent")).toBeInTheDocument();
            expect(getByText("Dynamo Detergent 1.5L")).toBeInTheDocument();
            expect(getByText("Price : 14")).toBeInTheDocument();
            expect(getByText("Nike Air Max")).toBeInTheDocument();
            expect(getByText("The new Nike Air Max 2024 Late")).toBeInTheDocument();
            expect(getByText("Price : 399")).toBeInTheDocument();
        });
    });

    it ("should render the Orders components if there is no order from user", async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                orders: []
            }
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
                <Routes>
                    <Route path="/dashboard/user/orders" element={<Orders />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText("All Orders")).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
            const rows = screen.queryAllByRole("row");
            expect(rows).toHaveLength(0);
        });

    });

    it("should handle error when fetching orders", async () => {
        axios.get.mockRejectedValueOnce(new Error("Failed to get user orders"));

        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
                <Routes>
                    <Route path="/dashboard/user/orders" element={<Orders />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText("All Orders")).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
            expect(toast.error).toHaveBeenCalledWith("Failed to get user orders");

            const rows = screen.queryAllByRole("row");
            expect(rows).toHaveLength(0);
            expect(getByText("All Orders")).toBeInTheDocument();
        });

        // Should inform user that there was an error
    });

});