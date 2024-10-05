import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import { ToastContainer } from 'react-hot-toast';
import CreateProduct from "./CreateProduct";
import { expect } from "@jest/globals";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

describe("Create Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mocked-url');
  });

  it("renders the create products page without crashing", () => {
    render(
      <Router>
        <CreateProduct />
      </Router>
    );
    expect(
      screen.getByRole("heading", { name: "Create Product" })
    ).toBeInTheDocument();
    expect(screen.getByText(/select a category/i)).toBeInTheDocument();
    expect(screen.getByText(/upload Photo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write a name/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/write a description/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write a Price/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/write a quantity/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/select Shipping/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create product/i })
    ).toBeInTheDocument();
  });

  it("should retrieve all categories available", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "Test",
            slug: "test",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const options = await screen.findAllByRole("option");
      // some issue when there are two options
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("cid_1");

    });
  });

  it("should not have any categories set when success is false", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: false,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "Test",
            slug: "test",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const options =  await screen.queryByRole("option");
      expect(options).toBe(null)
    });
  });

  it("should display error message when categories cannot be retrieved", async () => {
    axios.get.mockRejectedValue({
      data: {
        success: false,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "Test",
            slug: "test",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory"
      );
    });
  });

  it("inputs should be initially empty", () => {
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    expect(screen.getByPlaceholderText(/write a name/i).value).toBe("");
    expect(screen.getByPlaceholderText(/write a description/i).value).toBe("");
    expect(screen.getByPlaceholderText(/write a Price/i).value).toBe("");
    expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe("");
  });

  it("should allow typing for name, description, price and quantity", () => {
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });
    expect(screen.getByPlaceholderText(/write a name/i).value).toBe("name");
    expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
      "description"
    );
    expect(screen.getByPlaceholderText(/write a Price/i).value).toBe("1");
    expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe("1");
  });

  it("should have yes and no options for shipping", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    const selectPlaceholder = screen.getByText(/select shipping/i);
    fireEvent.mouseDown(selectPlaceholder);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("should have all the categories available for selection", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const options = await screen.findAllByRole("option");
      // some issue when there are two options
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("cid_1");
    });
  });


  it("should display error when product cannot be created successfully", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockRejectedValue({
      data: {
        success: false,
        message: "",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const category = await screen.getByText(/category1/i);
      fireEvent.click(category);
    });
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  // use pairwise testing + decision tables test generation techniques
  it("should create a product successfully with valid name, description, price, quantity, shipping, photo, category ", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const category = await screen.getByText(/category1/i);
      fireEvent.click(category);
    });
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });

    //photo upload
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const inputFile = screen.getByLabelText(/upload photo/i);
    fireEvent.change(inputFile, { target: { files: [file] } });

    // Check if the image preview is shown
    await waitFor(() => {
      const img = screen.getByAltText(/product_photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('blob:'));
    });

    const selectPlaceholder = screen.getByText(/select shipping/i);
    fireEvent.mouseDown(selectPlaceholder);
    const category = await screen.getByText("No", { selector: '.ant-select-item-option-content' });
    fireEvent.click(category);
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
  });

  it("should not create a product successfully with valid shipping, category but invalid name, description, price, quantity, photo", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const category = await screen.getByText(/category1/i);
      fireEvent.click(category);
    });

    const selectPlaceholder = screen.getByText(/select shipping/i);
    fireEvent.mouseDown(selectPlaceholder);
    const category = await screen.getByText("No", { selector: '.ant-select-item-option-content' });
    fireEvent.click(category);
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });

  it("should not create a product successfully with valid description, price, quantity, category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const category = await screen.getByText(/category1/i);
      fireEvent.click(category);
    });

    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });

  it("should not create a product successfully with valid price, shipping, photo but invalid name, description, quantity, category ", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });

    //photo upload
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const inputFile = screen.getByLabelText(/upload photo/i);
    fireEvent.change(inputFile, { target: { files: [file] } });

    // Check if the image preview is shown
    await waitFor(() => {
      const img = screen.getByAltText(/product_photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('blob:'));
    });

    const selectPlaceholder = screen.getByText(/select shipping/i);
    fireEvent.mouseDown(selectPlaceholder);
    const category = await screen.getByText("No", { selector: '.ant-select-item-option-content' });
    fireEvent.click(category);
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });

  it("should not create a product successfully with valid description, quantity, photo but invalid name, price, shipping, category ", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });

    //photo upload
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const inputFile = screen.getByLabelText(/upload photo/i);
    fireEvent.change(inputFile, { target: { files: [file] } });

    // Check if the image preview is shown
    await waitFor(() => {
      const img = screen.getByAltText(/product_photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('blob:'));
    });
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });


  it("should not create a product successfully with valid name, photo, category but invalid description, price, quantity, shipping", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const selectPlaceholder = screen.getByText(/select a category/i);
      fireEvent.mouseDown(selectPlaceholder);
      const category = await screen.getByText(/category1/i);
      fireEvent.click(category);
    });
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });

    //photo upload
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const inputFile = screen.getByLabelText(/upload photo/i);
    fireEvent.change(inputFile, { target: { files: [file] } });

    // Check if the image preview is shown
    await waitFor(() => {
      const img = screen.getByAltText(/product_photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('blob:'));
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });

  it("should fail to create the product with valid name, quantity, shipping but invalid description, price, photo, category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "1" },
    });

    const selectPlaceholder = screen.getByText(/select shipping/i);
    fireEvent.mouseDown(selectPlaceholder);
    const category = await screen.getByText("No", { selector: '.ant-select-item-option-content' });
    fireEvent.click(category);
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });


  it("should fail to create the product with valid name, description, price, but invalid quantity, shipping, photo, category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
          {
            _id: "cid_2",
            name: "category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "something went wrong",
        products: {
          name: "name",
          slug: "slug",
          description: "description",
          price: 1,
          category: "category1",
          quantity: 1,
          _id: "id",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });


});
