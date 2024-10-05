import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ProductDetails from "./ProductDetails";

jest.mock("axios");

const consoleSpy = jest.spyOn(console, "log").mockImplementation();

jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock('./../components/Layout', () => ({children, title}) => (
    <>
        <title>{title}</title>
        {children}
    </>
));

describe("<ProductDetails/>", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterEach(() => {
        consoleSpy.mockClear();
    });
    it("Should render ProductDetails correctly", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        render(
            <ProductDetails />
        );

        //Act
        const productDetailsTitle = await waitFor(() => screen.findByText("Product Details"));

        //Assert
        expect(productDetailsTitle).toBeInTheDocument();
    });

    it("Should navigate to error page when params is empty", async () => {
        //Arrange
        useParams.mockReturnValue({});
        render(
            <ProductDetails />
        );

        //Assert
        await waitFor(() => {
            expect(useNavigate).toHaveBeenCalledWith();
        });
    });

    it ("Should console log error when error in getting product", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        const mockGet = jest.spyOn(axios, 'get');

        mockGet.mockImplementation((url) => {
            if (url === "/api/v1/product/get-product/test-slug") {
                return Promise.reject(
                    new Error("Error getting product")
                );
            }
        });
        render(
            <ProductDetails />
        );

        //Assert
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(new Error("Error getting product"));
        });
    });

    it ("Should console log error when error in getting similar products", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        const mockGet = jest.spyOn(axios, 'get');

        mockGet.mockImplementation((url) => {
            if (url === "/api/v1/product/get-product/test-slug") {
                return Promise.resolve({
                    data: {  // Add `data` field here
                        product: {
                            _id: 1,
                            name: "product_test_1",
                            description: "product_test_1_description",
                            price: 123.45,
                            category: {
                                _id: 1,
                                name: "product_category_test_1",
                            },
                            quantity: 1
                        }
                    }
                });
            } else if (url === "/api/v1/product/related-product/1/1") {
                return Promise.reject(
                    new Error("Error getting similar product")
                );
            }
        });
        render(
            <ProductDetails />
        );

        //Assert
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(new Error("Error getting similar product"));
        });

    });

    it ("Should display products and related products when products found", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        const mockGet = jest.spyOn(axios, 'get');

        mockGet.mockImplementation((url) => {
            if (url === "/api/v1/product/get-product/test-slug") {
                return Promise.resolve({
                    data: {  // Add `data` field here
                        product: {
                            _id: 1,
                            name: "product_test_1",
                            description: "product_test_1_description",
                            price: 123.45,
                            category: {
                                _id: 1,
                                name: "product_category_test_1",
                            },
                            quantity: 1
                        }
                    }
                });
            } else if (url === "/api/v1/product/related-product/1/1") {
                return Promise.resolve({
                    data: {  // Add `data` field here
                        products: [
                            {
                                _id: 1,
                                name: "related_product_test_1",
                                description: "related_product_test_1_description",
                                price: 1,
                                category: {
                                    _id: 1,
                                },
                                quantity: 1
                            }, 
                            {
                                _id: 2,
                                name: "related_product_test_2",
                                description: "related_product_test_2_description",
                                price: 1,
                                category: {
                                    _id: 1,
                                },
                                quantity: 1
                            }, 
                            {
                                _id: 3,
                                name: "related_product_test_3",
                                description: "related_product_test_3_description",
                                price: 1,
                                category: {
                                    _id: 1,
                                },
                                quantity: 1
                            }, 
                        ]
                    }
                });
            }
        });
        render(
            <ProductDetails />
        );

        //Act
        const productDetailsTitle = screen.getByText("Product Details");

        //Assert
        expect(productDetailsTitle).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("Name : product_test_1")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("Description : product_test_1_description")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("Price :$123.45")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("Category : product_category_test_1")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("related_product_test_1")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("related_product_test_2")).toBeInTheDocument()
        });
        await waitFor(() => {
            expect(screen.getByText("related_product_test_3")).toBeInTheDocument()
        });
    });

    it("Should display message when no similar products not found", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        const mockGet = jest.spyOn(axios, 'get');

        mockGet.mockImplementation((url) => {
            if (url === "/api/v1/product/get-product/test-slug") {
            return Promise.resolve({
                data: {  // Add `data` field here
                    product: {
                        _id: 1,
                        name: "product_test_1",
                        description: "product_test_1_description",
                        price: 123.45,
                        category: {
                            _id: 1,
                            name: "product_category_test_1",
                        },
                        quantity: 1
                    }
                }
            });
            } else if (url === "/api/v1/product/related-product/1/1") {
                return Promise.resolve({
                    data: {
                        products: []
                    }
                });
            }
        });
        render(
            <ProductDetails />
        );

        //Act
        await waitFor(() => screen.findByText("No Similar Products found"));
        const similarProductText = screen.getByText("No Similar Products found");

        //Act and Assert
        await waitFor(() => {
            expect(similarProductText).toBeInTheDocument()
        });
    });

    it("Should navigate to product page when product clicked", async () => {
        //Arrange
        const slugMock = "test-slug";
        useParams.mockReturnValue({slug: slugMock});
        useNavigate.mockReturnValue(jest.fn());
        const navigate = useNavigate();
        const mockGet = jest.spyOn(axios, 'get');

        mockGet.mockImplementation((url) => {
            if (url === "/api/v1/product/get-product/test-slug") {
                return Promise.resolve({
                    data: {  // Add `data` field here
                        product: {
                            _id: 1,
                            name: "product_test_1",
                            description: "product_test_1_description",
                            price: 123.45,
                            category: {
                                _id: 1,
                                name: "product_category_test_1",
                            },
                            quantity: 1
                        }
                    }
                });
            } else if (url === "/api/v1/product/related-product/1/1") {
                return Promise.resolve({
                    data: {  // Add `data` field here
                        products: [
                            {
                                _id: 1,
                                name: "related_product_test_1",
                                description: "related_product_test_1_description",
                                price: 1,
                                category: {
                                    _id: 1,
                                },
                                quantity: 1,
                                slug: "test-related-slug"
                            }
                        ]
                    }
                });
            }
        });
        render(
            <ProductDetails />
        );

        //Act
        await waitFor(() => {
            expect(screen.getByText("More Details")).toBeInTheDocument();
        })
        fireEvent.click(screen.getByText("More Details"));

        //Assert
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith("/product/test-related-slug");

    });

});