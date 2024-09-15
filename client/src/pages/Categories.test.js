import React from "react";
import { render, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import slugify from "slugify";

jest.mock("../hooks/useCategory");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Category Component", () => {
  test("should render empty page correctly", () => {
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useCategory).toBeCalled();
    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  test("should render categories and links correctly", () => {
    let categories = [
      {
        name: "category one",
        slug: slugify("category one"),
      },
      {
        name: "category two",
        slug: slugify("category two"),
      }
    ];

    useCategory.mockReturnValue(categories);

    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useCategory).toBeCalled();
    expect(screen.getByText("All Categories")).toBeInTheDocument();

    // Appears in the page itself and the navbar
    const catOneLinks = screen.getAllByText("category one");
    expect(catOneLinks.length).toBe(2);
    catOneLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', "/category/category-one");
    })

    const catTwoLinks = screen.getAllByText("category two");
    expect(catTwoLinks.length).toBe(2);
    catTwoLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', "/category/category-two");
    })
  });
});
