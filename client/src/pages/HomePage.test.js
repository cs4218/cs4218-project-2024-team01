import React from "react";
import { fireEvent, waitFor, render, screen } from "@testing-library/react";
import { test, jest, expect, beforeEach } from "@jest/globals";
import axios from "axios";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import HomePage from "./HomePage";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";

// Mocking axios
jest.mock("axios");
jest.mock("react-hot-toast");

// Only test the component itself
jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <div>{title}</div>
    <div>{children}</div>
  </>
));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, "location", {
  value: { reload: jest.fn() },
  writable: true,
});

const categories = [
  {
    _id: "1",
    name: "category one",
    slug: "category-one",
  },
  {
    _id: "2",
    name: "category two",
    slug: "category-two",
  },
];

const generateProducts = (n) => {
  const products = [];
  for (let i = 1; i <= n; i++) {
    products.push({
      _id: i.toString(),
      name: `Product ${i}`,
      description: `This is product ${i}`,
      price: 10 + 20 * (i - 1),
      slug: `Product-${i}`,
      category: (((i - 1) % 2) + 1).toString(),
    });
  }
  return products;
};

const renderPage = () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </MemoryRouter>
  );
};

const mockGetResponse = (
  url,
  category,
  products,
  additionalProducts,
  total
) => {
  switch (url) {
    case "/api/v1/category/get-category":
      return Promise.resolve({
        data: { success: true, category },
      });
    case "/api/v1/product/product-list/1":
      return Promise.resolve({ data: { products } });
    case "/api/v1/product/product-list/2":
      return Promise.resolve({ data: { products: additionalProducts } });
    case "/api/v1/product/product-count":
      return Promise.resolve({ data: { total } });
    default:
      return null;
  }
};

const checkInitialAPIs = () => {
  expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
  expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
};

const checkExpectedProducts = (expectedProducts) => {
  expectedProducts.forEach((prd) => {
    expect(screen.getByText(prd.name)).toBeInTheDocument();
    expect(screen.getByText(prd.description + "...")).toBeInTheDocument();
    expect(screen.getByAltText(prd.name)).toBeInTheDocument();
    expect(
      screen.getByText(
        prd.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      )
    ).toBeInTheDocument();
  });
};

const checkExcludedProducts = (excludedProducts) => {
  excludedProducts.forEach((prd) => {
    expect(screen.queryByText(prd.name)).not.toBeInTheDocument();
    expect(screen.queryByText(prd.description + "...")).not.toBeInTheDocument();
    expect(screen.queryByAltText(prd.name)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        prd.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      )
    ).not.toBeInTheDocument();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Home Page component", () => {
  describe("for error handling", () => {
    let spy;

    beforeEach(() => {
      axios.get.mockImplementation((url) => {
        switch (url) {
          case "/api/v1/category/get-category":
            return Promise.reject(new Error("Failed to retrieve categories"));
          case "/api/v1/product/product-list/1":
            return Promise.reject(new Error("Failed to retrieve products"));
          case "/api/v1/product/product-list/2":
            return Promise.reject(
              new Error("Failed to retrieve additional products")
            );
          case "/api/v1/product/product-count":
            return Promise.reject(
              new Error("Failed to retrieve product count")
            );
          default:
            return null;
        }
      });

      axios.post.mockRejectedValue(new Error("Failed to filter products"));
      spy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    test("should log error if any of the initial retrieval APIs fail", async () => {
      renderPage();
      checkInitialAPIs();

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(3));

      expect(spy).toHaveBeenCalledWith(
        new Error("Failed to retrieve product count")
      );
      expect(spy).toHaveBeenCalledWith(
        new Error("Failed to retrieve products")
      );
      expect(spy).toHaveBeenCalledWith(
        new Error("Failed to retrieve categories")
      );
    });

    test("should log error when filtering products fails", async () => {
      renderPage();

      expect(screen.getByLabelText("$0 to 19")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("$0 to 19"));

      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: [],
          radio: [0, 19],
        }
      );

      await waitFor(() =>
        expect(spy).toHaveBeenCalledWith(new Error("Failed to filter products"))
      );
    });

    test("should log error when loading more products fails", async () => {
      const products = generateProducts(7);
      axios.get.mockImplementation((url) => {
        switch (url) {
          case "/api/v1/category/get-category":
            return Promise.resolve({
              data: { success: true, category: categories },
            });
          case "/api/v1/product/product-list/1":
            return Promise.resolve({
              data: { products: products.slice(0, 6) },
            });
          case "/api/v1/product/product-count":
            return Promise.resolve({ data: { total: products.length } });
          case "/api/v1/product/product-list/2":
            return Promise.reject(
              new Error("Failed to retrieve additional products")
            );
          default:
            return null;
        }
      });

      renderPage();

      expect(await screen.findByText("Loadmore")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Loadmore"));

      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
      await waitFor(() =>
        expect(spy).toHaveBeenCalledWith(
          new Error("Failed to retrieve additional products")
        )
      );
    });
  });

  describe("with no categories and products", () => {
    test("should render page correctly", async () => {
      axios.get.mockImplementation((url) =>
        mockGetResponse(url, [], [], [], 0)
      );
      axios.post.mockResolvedValueOnce({ data: { products: [] } });
      renderPage();

      await waitFor(() => checkInitialAPIs());

      // Banner and title
      expect(
        screen.getByText("ALL Products - Best offers")
      ).toBeInTheDocument();
      const vaultImg = screen.getByRole("img");
      expect(vaultImg).toBeInTheDocument();
      expect(vaultImg).toHaveAttribute("src", "/images/Virtual.png");
      expect(vaultImg).toHaveAttribute("alt", "bannerimage");

      // filter by categories
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

      // filter by price
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      Prices.forEach((priceOpt) => {
        expect(screen.getByLabelText(priceOpt.name)).toBeInTheDocument();
        expect(screen.getByLabelText(priceOpt.name)).not.toBeChecked();
      });

      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();

      // Products
      expect(screen.getByText("All Products")).toBeInTheDocument();
      expect(screen.queryByText("More Details")).not.toBeInTheDocument();
      expect(screen.queryByText("ADD TO CART")).not.toBeInTheDocument();
      expect(screen.queryByText("Loadmore")).not.toBeInTheDocument();
    });
  });

  describe("with 6 products and 2 categories", () => {
    test("should render page correctly with no load more button", async () => {
      const products = generateProducts(6);
      axios.get.mockImplementation((url) =>
        mockGetResponse(url, categories, products, [], products.length)
      );
      axios.post.mockResolvedValue({ data: { products: [] } });

      renderPage();
      checkInitialAPIs();

      // Banner and title
      expect(
        screen.getByText("ALL Products - Best offers")
      ).toBeInTheDocument();
      const vaultImg = screen.getByRole("img");
      expect(vaultImg).toBeInTheDocument();
      expect(vaultImg).toHaveAttribute("src", "/images/Virtual.png");
      expect(vaultImg).toHaveAttribute("alt", "bannerimage");

      // filter by categories
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(await screen.findByLabelText("category one")).toBeInTheDocument();
      expect(screen.getByLabelText("category one")).not.toBeChecked();
      expect(await screen.findByLabelText("category two")).toBeInTheDocument();
      expect(screen.getByLabelText("category two")).not.toBeChecked();

      // filter by price
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      Prices.forEach((priceOpt) => {
        expect(screen.getByLabelText(priceOpt.name)).toBeInTheDocument();
        expect(screen.getByLabelText(priceOpt.name)).not.toBeChecked();
      });

      // Products
      expect(screen.getByText("All Products")).toBeInTheDocument();
      await waitFor(() => checkExpectedProducts(products));

      expect(screen.getAllByText("More Details").length).toBe(6);
      expect(screen.getAllByText("ADD TO CART").length).toBe(6);
      expect(screen.queryByText("Loadmore")).not.toBeInTheDocument();
    });
  });

  describe("with 7 products and 2 categories", () => {
    const products = generateProducts(7);
    beforeEach(() => {
      axios.get.mockImplementation((url) =>
        mockGetResponse(
          url,
          categories,
          products.slice(0, 6),
          [products[6]],
          products.length
        )
      );

      axios.post.mockResolvedValue({ data: { products: [] } });
    });

    test("should render page correctly with load more button", async () => {
      renderPage();
      checkInitialAPIs();

      // Banner and title
      expect(
        screen.getByText("ALL Products - Best offers")
      ).toBeInTheDocument();
      const vaultImg = screen.getByRole("img");
      expect(vaultImg).toBeInTheDocument();
      expect(vaultImg).toHaveAttribute("src", "/images/Virtual.png");
      expect(vaultImg).toHaveAttribute("alt", "bannerimage");

      // filter by categories
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(await screen.findByLabelText("category one")).toBeInTheDocument();
      expect(screen.getByLabelText("category one")).not.toBeChecked();
      expect(await screen.findByLabelText("category two")).toBeInTheDocument();
      expect(screen.getByLabelText("category two")).not.toBeChecked();

      // filter by price
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
      Prices.forEach((priceOpt) => {
        expect(screen.getByLabelText(priceOpt.name)).toBeInTheDocument();
        expect(screen.getByLabelText(priceOpt.name)).not.toBeChecked();
      });

      // Products
      expect(screen.getByText("All Products")).toBeInTheDocument();
      await waitFor(() => checkExpectedProducts(products.slice(0, 6)));
      await waitFor(() => checkExcludedProducts([products[6]]));

      expect(screen.getAllByText("More Details").length).toBe(6);
      expect(screen.getAllByText("ADD TO CART").length).toBe(6);
      expect(screen.getByText("Loadmore")).toBeInTheDocument();
    });

    test("should be able to load in more products", async () => {
      renderPage();
      checkInitialAPIs();

      await waitFor(() => checkExcludedProducts([products[6]]));

      expect(await screen.findByText("Loadmore")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Loadmore"));

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2")
      );
      await waitFor(() => checkExpectedProducts([products[6]]));
    });
  });

  describe("for a given product", () => {
    const products = generateProducts(1);

    beforeEach(() => {
      axios.get.mockImplementation((url) =>
        mockGetResponse(url, categories, products, [], products.length)
      );
      axios.post.mockResolvedValue({ data: { products: [] } });
    });

    test("should be able to add product to cart", async () => {
      const setCart = jest.fn();
      useCart.mockReturnValue([[], setCart]);

      renderPage();
      checkInitialAPIs();

      expect(await screen.findByText("ADD TO CART")).toBeInTheDocument();
      fireEvent.click(screen.getAllByText("ADD TO CART")[0]);

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart")
      );
      expect(setCart).toHaveBeenCalledWith([products[0]]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([products[0]])
      );
    });

    test("should be able to navigate user to product details", async () => {
      const mockNavigate = jest.fn();
      useNavigate.mockReturnValue(mockNavigate);

      renderPage();
      checkInitialAPIs();

      expect(await screen.findByText("More Details")).toBeInTheDocument();
      fireEvent.click(screen.getAllByText("More Details")[0]);

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("/product/Product-1")
      );
    });
  });

  describe("for filtering", () => {
    test("should be able to reset filters", async () => {
      renderPage();

      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();

      fireEvent.click(screen.getByText("RESET FILTERS"));

      await waitFor(() => expect(window.location.reload).toHaveBeenCalled());
    });

    /* Will fail as 100 or more imposes a hard limit of 9999 
    despite the backend not restricting the limit during product creation. */
    test("should render products with prices > 9999", async () => {
      const overpricedProduct = {
        _id: "1",
        name: "Product 1",
        description: "This is product 1",
        price: 10000,
        slug: "Product-1",
        category: "1",
      };

      axios.get.mockImplementation((url) =>
        mockGetResponse(
          url,
          categories,
          [overpricedProduct],
          [],
          [overpricedProduct].length
        )
      );
      axios.post.mockResolvedValue({ data: { products: [] } });

      renderPage();
      checkInitialAPIs();

      await waitFor(() => checkExpectedProducts([overpricedProduct]));

      expect(screen.getByLabelText("$100 or more")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("$100 or more"));
      expect(await screen.findByLabelText("category one")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("category one"));

      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/product-filters",
          {
            checked: ["1"],
            radio: [100, 9999],
          }
        )
      );

      await waitFor(() => checkExpectedProducts([overpricedProduct]));
    });

    /* This will fail as the load more button is dependent on total product count rather than 
    num of product left after filtering */
    test("should not display load more button after filtering 7 products to 1", async () => {
      const products = generateProducts(7);
      axios.get.mockImplementation((url) =>
        mockGetResponse(
          url,
          categories,
          products.slice(0, 6),
          [products[6]],
          products.length
        )
      );

      axios.post.mockResolvedValue({
        data: {
          products: products.filter(
            (prd) => prd.category === "1" && 0 <= prd.price && prd.price <= 19
          ),
        },
      });

      renderPage();

      expect(await screen.findByLabelText("category one")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("category one"));
      fireEvent.click(screen.getByLabelText("$0 to 19"));

      await waitFor(() =>
        expect(screen.getAllByText("ADD TO CART").length).toBe(1)
      );
      await waitFor(() =>
        expect(screen.queryByText("Loadmore")).not.toBeInTheDocument()
      );
    });

    /* This will fail as the getAllProducts method gets called along with filterProduct method 
    which is unintended and leads to race conditions where the filter might not be successful */
    test("should be able to filter using categories only", async () => {
      const products = generateProducts(6);
      axios.get.mockImplementation((url) =>
        mockGetResponse(url, categories, products, [], products.length)
      );

      const expectedProducts = products.filter((prd) => prd.category === "1");
      const excludedProducts = products.filter(
        (prd) => !expectedProducts.includes(prd)
      );

      axios.post.mockResolvedValueOnce({
        data: { products: expectedProducts },
      });

      renderPage();
      checkInitialAPIs();
      expect(axios.get).toHaveBeenCalledTimes(3);

      expect(await screen.findByLabelText("category one")).toBeInTheDocument();
      expect(screen.getByLabelText("category one")).not.toBeChecked();
      expect(await screen.findByLabelText("category two")).toBeInTheDocument();
      expect(screen.getByLabelText("category two")).not.toBeChecked();

      fireEvent.click(screen.getByLabelText("category one"));

      expect(screen.getByLabelText("category one")).toBeChecked();

      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/product-filters",
          {
            checked: ["1"],
            radio: [],
          }
        )
      );

      await waitFor(() => checkExpectedProducts(expectedProducts));
      await waitFor(() => checkExcludedProducts(excludedProducts));

      // Should only be the initial 3 times, filtering should not call getAllProducts again
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
    });

    /* This will fail as the getAllProducts method gets called along with filterProduct method 
    which is unintended and leads to race conditions where the filter might not be successful */
    Prices.forEach((priceOpt) => {
      test(`should be able to filter using price range ${priceOpt.name} only`, async () => {
        const products = generateProducts(6);
        axios.get.mockImplementation((url) =>
          mockGetResponse(url, categories, products, [], products.length)
        );

        const expectedProducts = products.filter(
          (prd) =>
            priceOpt.array[0] <= prd.price && prd.price <= priceOpt.array[1]
        );
        const excludedProducts = products.filter(
          (prd) => !expectedProducts.includes(prd)
        );

        axios.post.mockResolvedValueOnce({
          data: { products: expectedProducts },
        });

        renderPage();
        checkInitialAPIs();
        expect(axios.get).toHaveBeenCalledTimes(3);

        expect(screen.getByLabelText(priceOpt.name)).toBeInTheDocument();
        expect(screen.getByLabelText(priceOpt.name)).not.toBeChecked();

        fireEvent.click(screen.getByLabelText(priceOpt.name));
        expect(screen.getByLabelText(priceOpt.name)).toBeChecked();

        await waitFor(() =>
          expect(axios.post).toHaveBeenCalledWith(
            "/api/v1/product/product-filters",
            {
              checked: [],
              radio: priceOpt.array,
            }
          )
        );

        await waitFor(() => checkExpectedProducts(expectedProducts));
        await waitFor(() => checkExcludedProducts(excludedProducts));

        // Should only be the initial 3 times, filtering should not call getAllProducts again
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
      });
    });

    /* Will pass as selecting both a category and price range will not call getAllProducts 
    and filterProducts at the same time */
    Prices.forEach((priceOpt) =>
      test(`should be able to filter using categories and price range ${priceOpt.name}`, async () => {
        const products = generateProducts(6);
        axios.get.mockImplementation((url) =>
          mockGetResponse(url, categories, products, [], products.length)
        );

        const expectedProducts = products.filter(
          (prd) =>
            prd.category === "1" &&
            priceOpt.array[0] <= prd.price &&
            prd.price <= priceOpt.array[1]
        );

        const excludedProducts = products.filter(
          (prd) => !expectedProducts.includes(prd)
        );

        axios.post.mockResolvedValue({
          data: { products: expectedProducts },
        });

        renderPage();
        checkInitialAPIs();

        expect(
          await screen.findByLabelText("category one")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("category one")).not.toBeChecked();
        expect(screen.getByLabelText(priceOpt.name)).toBeInTheDocument();
        expect(screen.getByLabelText(priceOpt.name)).not.toBeChecked();

        fireEvent.click(screen.getByLabelText("category one"));
        fireEvent.click(screen.getByLabelText(priceOpt.name));

        expect(screen.getByLabelText("category one")).toBeChecked();
        expect(screen.getByLabelText(priceOpt.name)).toBeChecked();

        await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));

        expect(axios.post.mock.calls[0][0]).toBe(
          "/api/v1/product/product-filters"
        );
        expect(axios.post.mock.calls[0][1]).toEqual({
          checked: ["1"],
          radio: [],
        });

        expect(axios.post.mock.calls[1][0]).toBe(
          "/api/v1/product/product-filters"
        );
        expect(axios.post.mock.calls[1][1]).toEqual({
          checked: ["1"],
          radio: priceOpt.array,
        });

        await waitFor(() => checkExpectedProducts(expectedProducts));
        await waitFor(() => checkExcludedProducts(excludedProducts));
      })
    );
  });
});
