import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import AdminOrders from "./AdminOrders";
import { expect } from "@jest/globals";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: { name: "Test User", email: "test@example.com" }, // Mocked user
      token: "mocked_token", // Mocked token
    },
    jest.fn(), // Mock setAuth function (you can later track or assert how it's called)
  ]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

describe("Admin Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the admin orders page without errors", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createAt: Date.now().toString(),
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product 1",
              description: "Product 1 description",
              price: 100,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>
    );

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Not Process/i)).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText(/Product 1 description/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 100/i)).toBeInTheDocument();
    });
  });

  it("does not display the order details if there is error in retrieving the orders", async () => {
    axios.get.mockRejectedValue({
      data: [
        {
          _id: "1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createAt: Date.now().toString(),
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product 1",
              description: "Product 1 description",
              price: 100,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>
    );

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.queryByText(/john doe/i)).not.toBeInTheDocument();
    });
  });

  it("should change the order status of the product successfully", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createAt: "2024-09-15T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product 1",
              description: "Product 1 description",
              price: 100,
            },
          ],
        },
      ],
    });

    axios.put.mockResolvedValue({
      data: { success: true },
    });

    render(
      <Router>
        <AdminOrders/>
      </Router>
    );

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Not Process/i)).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText(/Product 1 description/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 100/i)).toBeInTheDocument();
    });

    const dropdown = screen.getByText(/not process/i);
    fireEvent.mouseDown(dropdown);
    const optionToSelect = screen.getByText('Shipped');
    fireEvent.click(optionToSelect);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/order-status/1', {
        status: 'Shipped',
      });
    })

  });

  it("should log error message when order status cannot be updated successfully", async () => {
    console.log = jest.fn();
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createAt: "2024-09-15T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product 1",
              description: "Product 1 description",
              price: 100,
            },
          ],
        },
      ],
    });

    axios.put.mockRejectedValue({
      data: { success: false },
    });

    render(
      <Router>
        <AdminOrders/>
      </Router>
    );

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Not Process/i)).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText(/Product 1 description/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 100/i)).toBeInTheDocument();
    });

    const dropdown = screen.getByText(/not process/i);
    fireEvent.mouseDown(dropdown);
    const optionToSelect = screen.getByText('Shipped');
    fireEvent.click(optionToSelect);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/order-status/1', {
        status: 'Shipped',
      });
      expect(console.log).toHaveBeenCalledWith({"data": {"success": false}});
    })

  });
});
