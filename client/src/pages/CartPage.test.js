import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import axios from "axios";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import DropIn from "braintree-web-drop-in-react";

// Mocking axios
jest.mock("axios");
jest.mock("react-hot-toast");

// Only test the component itself
jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("braintree-web-drop-in-react", () => ({
  __esModule: true,
  default: jest.fn(() => <div>MockDropIn</div>),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const products = [
  {
    _id: "1",
    name: "product one",
    description: "this is product one",
    price: 10,
  },
  {
    _id: "2",
    name: "product two",
    description: "this is product two",
    price: 20,
  },
];

const mockUser = [
  {
    token: "token",
    user: {
      _id: "1",
      name: "Jane Doe",
    },
  },
  jest.fn(),
];

const mockUserWithAddress = [
  {
    token: "token",
    user: {
      _id: "1",
      name: "Jane Doe",
      address: "test",
    },
  },
  jest.fn(),
]

const renderPage = () => {
  render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Cart Component", () => {
  describe("When user not logged in", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce(null);
    });

    test("should render guest page with empty cart", async () => {
      renderPage();
      expect(useCart).toBeCalled();

      // Header
      expect(screen.getByText("Hello Guest")).toBeInTheDocument();
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();

      // Cart Summary
      await waitFor(() => {
        expect(screen.queryByText("MockDropIn")).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Plase Login to checkout")).toBeInTheDocument();

      // Products
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });

    test("should render cart items in guest page", async () => {
      useCart.mockReturnValueOnce([products, jest.fn()]);

      renderPage();
      expect(useCart).toBeCalled();

      // Header
      expect(screen.getByText("Hello Guest")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You Have 2 items in your cart please login to checkout !"
        )
      ).toBeInTheDocument();

      // Cart Summary
      await waitFor(() => {
        expect(screen.queryByText("MockDropIn")).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Total : $30.00")).toBeInTheDocument();
      expect(screen.getByText("Plase Login to checkout")).toBeInTheDocument();

      // Products
      expect(screen.getByText("product one")).toBeInTheDocument();
      expect(screen.getByText("this is product one")).toBeInTheDocument();
      expect(screen.getByText("Price : 10")).toBeInTheDocument();
      expect(screen.getByText("product two")).toBeInTheDocument();
      expect(screen.getByText("this is product two")).toBeInTheDocument();
      expect(screen.getByText("Price : 20")).toBeInTheDocument();
      expect(screen.getAllByText("Remove").length).toBe(2);
    });

    test("should navigate user to login page when checking out", async () => {
      const mockNavigate = jest.fn();
      useNavigate.mockReturnValue(mockNavigate);
      renderPage();

      fireEvent.click(screen.getByText("Plase Login to checkout"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" })
      );
    });
  });

  describe("When user is logged in", () => {
    beforeEach(() => {
      useAuth.mockReturnValue(mockUser);
      axios.get.mockResolvedValueOnce(null);
    });

    test("should render normal page with empty cart", async () => {
      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();

      // Header
      expect(screen.getByText("Hello Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();

      // Cart Summary
      expect(
        screen.queryByText("Plase Login to checkout")
      ).not.toBeInTheDocument();

      // Products
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });

    test("should render cart items in normal page", async () => {
      useCart.mockReturnValueOnce([products, jest.fn()]);

      renderPage();
      expect(useCart).toBeCalled();

      // Header
      expect(screen.getByText("Hello Jane Doe")).toBeInTheDocument();
      expect(
        screen.getByText("You Have 2 items in your cart")
      ).toBeInTheDocument();

      // Cart Summary
      expect(screen.getByText("Total : $30.00")).toBeInTheDocument();
      expect(
        screen.queryByText("Plase Login to checkout")
      ).not.toBeInTheDocument();

      // Products
      expect(screen.getByText("product one")).toBeInTheDocument();
      expect(screen.getByText("this is product one")).toBeInTheDocument();
      expect(screen.getByText("Price : 10")).toBeInTheDocument();
      expect(screen.getByText("product two")).toBeInTheDocument();
      expect(screen.getByText("this is product two")).toBeInTheDocument();
      expect(screen.getByText("Price : 20")).toBeInTheDocument();
      expect(screen.getAllByText("Remove").length).toBe(2);
    });
  });

  describe("When user is logged in without any address", () => {
    test("should navigate user to profile to set address", async () => {
      useAuth.mockReturnValue(mockUser);
      useCart.mockReturnValue([products, jest.fn()]);
      axios.get.mockResolvedValueOnce(null);

      const mockNavigate = jest.fn();
      useNavigate.mockReturnValue(mockNavigate);

      renderPage();

      fireEvent.click(screen.getByText("Update Address"));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile")
      );
    });
  });

  describe("When user is logged in without any address or payment gateway token", () => {
    test("should render normal cart page without user address and DropIn", async () => {
      useAuth.mockReturnValue(mockUser);
      useCart.mockReturnValue([products, jest.fn()]);
      axios.get.mockResolvedValueOnce(null);

      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");

      // Cart Summary
      await waitFor(() => {
        expect(screen.queryByText("MockDropIn")).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Update Address")).toBeInTheDocument();
      expect(
        screen.queryByText("Plase Login to checkout")
      ).not.toBeInTheDocument();
    });
  });

  describe("When user is logged in with payment gateway token but no address", () => {
    test("should render normal cart page with DropIn with disabled payment and no user address", async () => {
      useAuth.mockReturnValue(mockUser);
      useCart.mockReturnValue([products, jest.fn()]);
      axios.get.mockResolvedValueOnce({
        data: { clientToken: "clientToken" },
      });

      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");

      // Cart Summary
      expect(await screen.findByText("MockDropIn")).toBeInTheDocument();
      expect(await screen.findByText("Make Payment")).toBeInTheDocument();
      expect(screen.getByText("Make Payment")).toBeDisabled();
    });
  });

  describe("When user is logged in with address and payment gateway token", () => {
    const mockInstance = {
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "nonce" }),
    };

    const mockNavigate = jest.fn();
    const setCart = jest.fn();

    beforeEach(() => {
      useAuth.mockReturnValue(mockUserWithAddress);
      useCart.mockReturnValue([products, setCart]);
      useNavigate.mockReturnValue(mockNavigate);
      axios.get.mockResolvedValueOnce({ data: { clientToken: "clientToken" } });

      DropIn.mockImplementationOnce(({ onInstance }) => {
        onInstance(mockInstance);
        return <div>MockDropIn</div>;
      });
    });

    test("should render normal page with address and DropIn with payment initially disabled", async () => {
      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");

      // Cart Summary
      expect(await screen.findByText("MockDropIn")).toBeInTheDocument();
      expect(await screen.findByText("Make Payment")).toBeInTheDocument();
      expect(screen.getByText("Make Payment")).toBeDisabled();
      expect(screen.getByText("Current Address")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("Update Address")).toBeInTheDocument();
    });

    test("should navigate user to profile to update address", async () => {
      renderPage();

      fireEvent.click(screen.getByText("Update Address"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile")
      );
    });

    test("should log error if payment fails", async () => {
      const error = new Error("Payment Failed");
      axios.post.mockRejectedValueOnce(error);

      const spy = jest.spyOn(console, "log").mockImplementationOnce(() => {});

      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");

      // Cart Summary
      expect(await screen.findByText("MockDropIn")).toBeInTheDocument();
      expect(await screen.findByText("Make Payment")).toBeInTheDocument();
      expect(screen.getByText("Make Payment")).not.toBeDisabled();

      fireEvent.click(screen.getByText("Make Payment"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "nonce",
            cart: products,
          }
        );
      });

      expect(spy).toHaveBeenCalledWith(error);
      expect(mockNavigate).toBeCalledTimes(0);
      expect(setCart).toBeCalledTimes(0);
      expect(localStorage.removeItem).toBeCalledTimes(0);
      expect(toast.success).toBeCalledTimes(0);
    });

    test("should be able to make payment", async () => {
      axios.post.mockResolvedValueOnce({ data: null });
      renderPage();

      expect(useAuth).toBeCalled();
      expect(useCart).toBeCalled();
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");

      // Cart Summary
      expect(await screen.findByText("MockDropIn")).toBeInTheDocument();
      expect(await screen.findByText("Make Payment")).toBeInTheDocument();
      expect(screen.getByText("Make Payment")).not.toBeDisabled();

      fireEvent.click(screen.getByText("Make Payment"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "nonce",
            cart: products,
          }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      expect(setCart).toHaveBeenCalledWith([]);
      expect(localStorage.removeItem).toHaveBeenCalledWith("cart");
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully "
      );
    });
  });

  describe("In general", () => {
    test("should allow user to remove cart items", async () => {
      const setCart = jest.fn();
      useCart.mockReturnValueOnce([products, setCart]);

      renderPage();
      expect(useCart).toBeCalled();

      // Header
      expect(
        screen.getByText("You Have 2 items in your cart")
      ).toBeInTheDocument();

      fireEvent.click(screen.getAllByText("Remove")[0]);

      await waitFor(() => expect(setCart).toHaveBeenCalledWith([products[1]]));
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([products[1]])
      );
    });

    test("should log error when removing cart item fails", async () => {
      const error = new Error("Error setting cart");
      const setCart = jest.fn(() => {
        throw error;
      });
      useCart.mockReturnValueOnce([products, setCart]);

      const spy = jest.spyOn(console, "log").mockImplementationOnce(() => {});

      renderPage();
      expect(useCart).toBeCalled();

      fireEvent.click(screen.getAllByText("Remove")[0]);
      await waitFor(() => expect(spy).toHaveBeenCalledWith(error));
    });
  });
});
