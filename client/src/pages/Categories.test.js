import React from "react";
import { render, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import slugify from "slugify";

jest.mock("../hooks/useCategory");

// Only test the component itself
jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <title>{title}</title>
    <div>{children}</div>
  </>
));

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

    // No categories present to be clickable
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("should render categories and links correctly", async () => {
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

    expect(screen.getByText("category one")).toBeInTheDocument();
    expect(screen.getByText("category one")).toHaveAttribute('href', "/category/category-one");
    expect(screen.getByText("category two")).toBeInTheDocument();
    expect(screen.getByText("category two")).toHaveAttribute('href', "/category/category-two");
  });
});
