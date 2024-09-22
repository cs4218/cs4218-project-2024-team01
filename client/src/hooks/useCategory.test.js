import { waitFor, renderHook } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import useCategory from "./useCategory";
import slugify from "slugify";

// Mocking axios
jest.mock("axios");

describe("For Use Category Hook", () => {
  test("should be able to retrieve categories", async () => {
    const categories = [
      {
        name: "category one",
        slug: slugify("category one"),
      },
      {
        name: "category two",
        slug: slugify("category two"),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { category: categories } });

    const { result } = renderHook(() => useCategory());

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    await waitFor(() => expect(result.current).toEqual(categories));
  });

  test("shoud log error when retrieve fails", async () => {
    const error = new Error("Failed to retrieve categories");
    axios.get.mockRejectedValueOnce(error);

    const spy = jest.spyOn(console, "log").mockImplementationOnce(() => {});

    renderHook(() => useCategory());

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    await waitFor(() => expect(spy).toHaveBeenCalledWith(error));
  });
});
