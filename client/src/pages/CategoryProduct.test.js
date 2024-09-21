import React from "react";
import { fireEvent, waitFor, render, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import axios from "axios";
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CategoryProduct from "./CategoryProduct";
import slugify from "slugify";

// Mocking axios
jest.mock("axios");

// Only test the component itself
jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useParams.mockReturnValueOnce({ slug: slugify("category one") });
});

const category = {
  _id: "1",
  name: "category one",
  slug: slugify("category one"),
};

describe("Category Product component", () => {
  test("Should render category with no products", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        category,
        products: [],
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/category-one"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useParams).toBeCalled();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/category-one"
    );

    await screen.findByText("Category - category one");
    expect(screen.getByText("Category - category one")).toBeInTheDocument();
    expect(screen.getByText("0 result found")).toBeInTheDocument();
    expect(screen.queryByText("More Details")).not.toBeInTheDocument();
  });

  test("Should render category with products", async () => {
    const products = [
      {
        _id: "2",
        name: "product one",
        description: "this is product one",
        price: 10,
        category: "1"
      },
      {
        _id: "3",
        name: "product two",
        description: "this is product two",
        price: 20,
        category: "1",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: {
        category,
        products,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/category-one"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useParams).toBeCalled();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/category-one"
    );

    await screen.findByText("Category - category one");
    expect(screen.getByText("Category - category one")).toBeInTheDocument();
    expect(screen.getByText("2 result found")).toBeInTheDocument();
    expect(screen.getByText("product one")).toBeInTheDocument();
    expect(screen.getByText("this is product one...")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("product two")).toBeInTheDocument();
    expect(screen.getByText("this is product two...")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getAllByText("More Details").length).toBe(2);
  });

  test("should allow user to navigate to product page", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    const products = [
      {
        _id: "2",
        name: "product one",
        description: "this is product one",
        price: 10,
        slug: slugify("product one"),
        category: "1",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: {
        category,
        products,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/category-one"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useParams).toBeCalled();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/category-one"
    );

    await screen.findByText("Category - category one");

    fireEvent.click(screen.getByText("More Details"));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/product/product-one")
    );
  });

  test("should not truncate a product's description of length 60", async () => {
    const longDescription = "tis is product one with a very long description to be tested";
    const products = [
      {
        _id: "2",
        name: "product one",
        description: longDescription,
        price: 10,
        category: "1",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: {
        category,
        products,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/category-one"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useParams).toBeCalled();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/category-one"
    );

    expect(longDescription.length).toBe(60);

    await screen.findByText("Category - category one");
    expect(screen.getByText(longDescription + "...")).toBeInTheDocument();
  });

  test("should truncate a product's description of length > 60", async () => {
    const exceededDescription = "tis is product one with a very long description to be tested that will be truncated";
    const truncatedDescripton = "tis is product one with a very long description to be tested...";
    const products = [
      {
        _id: "2",
        name: "product one",
        description: exceededDescription,
        price: 10,
        category: "1",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: {
        category,
        products,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/category-one"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useParams).toBeCalled();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/category-one"
    );

    expect(exceededDescription.length).toBeGreaterThan(60);

    await screen.findByText("Category - category one");
    expect(screen.getByText(truncatedDescripton)).toBeInTheDocument();
  });
});
