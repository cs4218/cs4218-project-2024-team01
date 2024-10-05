import { beforeEach, describe, jest, test, expect } from '@jest/globals';
import { ProductBuilder } from '../testutils/product/productBuilder.js';

import { 
    createProductController, 
    getProductController, 
    getSingleProductController, 
    productPhotoController,
    deleteProductController,
    updateProductController,
    productFiltersController,
    productCountController,
    productListController,
    searchProductController,
    realtedProductController,
    productCategoryController,
    braintreeTokenController,
    brainTreePaymentController, 
} from "../controllers/productController.js";
import productModel from '../models/productModel.js';
import braintree from "braintree";
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';

//Mock request and response
let req;
let res;
const fillProductFormAndMockResponse = (isValidRequest, hasPhoto, InvalidField) => {
    let invalidRequest = new ProductBuilder()
        .withName(null)
        .withPrice(null)
        .withDescription(null)
        .withImage(null)
        .withCategory(null)
        .withQuantity(null)
        .withShipping(null)
        .build();
    let photoData = {
        path: "/Users/weemingqing/Documents/CS4218/cs4218-project-2024-team01/client/public/images/a1.png",
        type: 'png',
        size: 1000000
    }
    let validRequest = new ProductBuilder().build();
    switch (InvalidField) {
        case "name":
            validRequest.name = null;
            break;
        case "description":
            validRequest.description = null;
            break;
        case "price":
            validRequest.price = null;
            break;
        case "category":
            validRequest.category = null;
            break;
        case "quantity":
            validRequest.quantity = null;
            break;
        case "photo":
            photoData.size = 1000001;
            break;
        default:
            break;
    }
    req = {
        fields: isValidRequest ? validRequest : invalidRequest,
        files: hasPhoto ? {photo: photoData} : {},
        user: { _id: 1 },
    };

    res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    }

    jest.clearAllMocks();
}

jest.mock("../models/productModel.js");
jest.mock('braintree');
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe("Given that createProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy.mockClear();
    });
    describe("Receives valid product form", () => {
        beforeEach(() => {
            fillProductFormAndMockResponse(true, false, "none");
            consoleSpy.mockClear();
        });
        test("Product created with photo successfully", async () => {
                fillProductFormAndMockResponse(true, true, "none");
                let newProduct = new ProductBuilder().build();
                productModel.prototype.save = jest.fn().mockResolvedValueOnce(newProduct);
                await createProductController(req, res);
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.send).toHaveBeenCalledWith({
                    success: true,
                    message: "Product Created Successfully",
                    products: expect.objectContaining({
                        name: newProduct.name,
                        price: newProduct.price,
                        description: newProduct.description,
                        quantity: newProduct.quantity, 
                        shipping: newProduct.shipping,
                    }),
                });
        });

        test("Product created without photo successfully", async () => {
            fillProductFormAndMockResponse(true, false, "none");
            let newProduct = new ProductBuilder().build();
            productModel.prototype.save = jest.fn().mockResolvedValueOnce(newProduct);
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Product Created Successfully",
                products: expect.objectContaining({
                    name: newProduct.name,
                    price: newProduct.price,
                    description: newProduct.description,
                    quantity: newProduct.quantity, 
                    shipping: newProduct.shipping,
                }),
            });
    });

    });

    describe("Receives invalid product form", () => {

        test("Given name is empty", async () => {
            fillProductFormAndMockResponse(true, false, "name");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Name is Required",
            });
        });

        test("Given description is empty", async () => {
            fillProductFormAndMockResponse(true, false, "description");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Description is Required",
            });
        });

        test("Given price is empty", async () => {
            fillProductFormAndMockResponse(true, false, "price");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price is Required",
            });
        });

        test("Given category is empty", async () => {
            fillProductFormAndMockResponse(true, false, "category");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Category is Required",
            });
        });

        test("Given quantity is empty", async () => {
            fillProductFormAndMockResponse(true, false, "quantity");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity is Required",
            });
        });

        test("Given photo size is greater than 1MB", async () => {
            fillProductFormAndMockResponse(true, true, "photo");
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "photo is Required and should be less then 1mb",
            });
        });
    });

    describe("Returns Internal server error when error saving product occurs", () => {
        test("Given server error occurs", async () => {
            fillProductFormAndMockResponse(true, false, "none");
            const serverError = new Error("Internal Server Error");
            productModel.prototype.save = jest.fn().mockRejectedValue(serverError);
            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: serverError,
                success: false,
                message: "Error in crearing product",
            });
            expect(consoleSpy).toHaveBeenCalledWith(serverError);
        });
    });
});

describe("Given that getProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy.mockClear();
    });
    test("Get all products successfully", async() => {
        const mockProducts = [
            { _id: '1', name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1},
            { _id: '2', name: 'Product 2', category: { _id: 'cat2', name: 'Category 2' }, quantity: 1},
        ];
        const populateMock = jest.fn().mockReturnThis();
        const selectMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const sortMock = jest.fn().mockResolvedValue(mockProducts);
        jest.spyOn(productModel, 'find').mockImplementation(() => ({
            populate: populateMock,
            select: selectMock,
            limit: limitMock,
            sort: sortMock,
        }));
        
        await getProductController(req, res)
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            counTotal: mockProducts.length,
            message: "ALlProducts ",
            products: mockProducts,
        });
    });

    test("Error when getting all products", async() => {
        jest.spyOn(productModel, 'find').mockImplementation(() => {
            throw new Error("Cannot find products");
        });
        await getProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Erorr in getting products",
            error: "Cannot find products",
        });
        expect(consoleSpy).toHaveBeenCalledWith(new Error("Cannot find products"));
    });
});

describe("Given that getSingleProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        req.params = {slug: "test slug"};
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.params;
    })
    test("Get single product successfully", async() => {
        const mockProduct = { _id: '1', name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1};
        const selectMock = jest.fn().mockReturnThis();
        const populateMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, 'findOne').mockImplementation(() => ({
            select: selectMock,
            populate: populateMock,
        }));
        
        await getSingleProductController(req, res)
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Single Product Fetched",
            product: mockProduct,
        });
    });

    test("Error when getting single product", async() => {
        jest.spyOn(productModel, 'findOne').mockImplementation(() => {
            throw new Error("Cannot find single product");
        });
        await getSingleProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Eror while getitng single product",
            error: new Error("Cannot find single product"),
        });
    });
});

describe("Given that productPhotoController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        req.params = {pid: 1};
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.params;
    })

    test("Get product photo successfully", async() => {
        res.set = jest.fn().mockReturnThis();
        const mockProduct = { _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1, 
            photo: {
                data: "photo data",
                contentType: "image/png",
        }};
        const selectMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, 'findById').mockImplementation(() => ({
            select: selectMock
        }));
        
        await productPhotoController(req, res)
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith("photo data");
    });

    test("Error getting product photo when product throws error", async() => {
        jest.spyOn(productModel, 'findById').mockImplementation(() => {
            throw new Error("Cannot find single product");
        });
        
        await productPhotoController(req, res)
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Erorr while getting photo",
            error: new Error("Cannot find single product"),
        });
    });
});

describe("Given that deleteProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        req.params = {pid: 1};
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.params;
    });
    test("Delete product successfully", async () => {
        const mockProduct = { _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1};
        const selectMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, 'findByIdAndDelete').mockImplementation(() => ({
            select: selectMock
        }));
        await deleteProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product Deleted successfully",
        });
    });

    test("Error when deleting product", async () => {
        jest.spyOn(productModel, 'findByIdAndDelete').mockImplementation(() => {
            throw new Error("Cannot find single product");
        });
        await deleteProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error while deleting product",
            error: new Error("Cannot find single product"),
        });
    });
});

describe("Given that updateProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.params = {pid: 1};
        consoleSpy.mockClear();
    });
    afterEach(() => {
        delete req.params;
    });

    test("Update product with photo successfully", async () => {
        fillProductFormAndMockResponse(true, true, "None");
        req.params = {pid: 1};
        const mockProduct = new productModel({ _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1});
        jest.spyOn(productModel, "findByIdAndUpdate").mockResolvedValue(mockProduct);
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
        await updateProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product Updated Successfully",
            products: mockProduct,
        });
    });

    test("Update product successfully", async () => {
        const mockProduct = new productModel({ _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1});
        jest.spyOn(productModel, "findByIdAndUpdate").mockResolvedValue(mockProduct);
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
        await updateProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product Updated Successfully",
            products: mockProduct,
        });
    });

    test("Error when updating product", async () => {
        jest.spyOn(productModel, "findByIdAndUpdate").mockImplementation(() => {
            throw new Error("Cannot find single product");
        });
        await updateProductController(req, res)
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in Updte product",
            error: new Error("Cannot find single product"),
        });
    });

    describe("Receives invalid product form", () => {

        test("Given name is empty", async () => {
            fillProductFormAndMockResponse(true, false, "name");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Name is Required",
            });
        });

        test("Given description is empty", async () => {
            fillProductFormAndMockResponse(true, false, "description");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Description is Required",
            });
        });

        test("Given price is empty", async () => {
            fillProductFormAndMockResponse(true, false, "price");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price is Required",
            });
        });

        test("Given category is empty", async () => {
            fillProductFormAndMockResponse(true, false, "category");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Category is Required",
            });
        });

        test("Given quantity is empty", async () => {
            fillProductFormAndMockResponse(true, false, "quantity");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity is Required",
            });
        });

        test("Given photo size is greater than 1MB", async () => {
            fillProductFormAndMockResponse(true, true, "photo");
            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: "photo is Required and should be less then 1mb",
            });
        });
    });
});

describe("Given that productFiltersController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.body = {
            checked: ["test1", "test2"],
            radio: [1, 2],
        }
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.body;
    });

    test("Product filters successfully", async () => {
        const mockProduct = new productModel({ _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1});
        jest.spyOn(productModel, "find").mockResolvedValue([mockProduct]);
        await productFiltersController(req, res)
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            products: [mockProduct],
        });
    });

    test("Error while filtering products", async () => {
        jest.spyOn(productModel, "find").mockImplementation(() => {
            throw new Error("Cannot find products");
        });
        await productFiltersController(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error WHile Filtering Products",
            error: new Error("Cannot find products"),
        });
    });
});

describe("Given that productCountController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        consoleSpy.mockClear();
    });

    test("Product count successfully", async () => {     
        const estimatedDocumentCountMock = jest.fn().mockResolvedValue(1);
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            estimatedDocumentCount: estimatedDocumentCountMock
        }));
        await productCountController(req, res)
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            total: 1,
        });
    });

    test("Error while counting products", async () => {
        jest.spyOn(productModel, "find").mockImplementation(() => {
            throw new Error("Cannot find products");
        });
        await productCountController(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in product count",
            error: new Error("Cannot find products"),
        });
    });
});

describe("Given that productListController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.params = { page: 1 }
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.params;
    });

    test("Get product list successfully", async () => {
        const mockProduct = { _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1};
        const selectMock = jest.fn().mockReturnThis();
        const skipMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const sortMock = jest.fn().mockResolvedValue([mockProduct]);
        
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock,
            skip: skipMock,
            limit: limitMock,
            sort: sortMock
        }));
        await productListController(req, res)
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            products: [mockProduct],
        });
    });

    test("Error while getting products", async () => {
        const selectMock = jest.fn().mockReturnThis();
        const skipMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const sortMock = jest.fn().mockRejectedValue("Cannot find products");
        
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock,
            skip: skipMock,
            limit: limitMock,
            sort: sortMock
        }));
        await productListController(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "error in per page ctrl",
            error: "Cannot find products",
        });
    });
});

describe("Given that searchProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.params = { keyword: "test" }
        consoleSpy.mockClear();
    });

    afterEach(() => {
        delete req.params;
    });

    test("Search product successfully", async () => {
        res.json = jest.fn().mockReturnThis();
        const mockProduct = { _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1};
        const selectMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock
        }));
        await searchProductController(req, res)
        expect(res.json).toBeCalledWith(mockProduct);
    });

    test("Error while searching products", async () => {
        const selectMock = jest.fn().mockRejectedValue("Cannot find products");
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock
        }));
        await searchProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error In Search Product API",
            error: "Cannot find products"
        }) 
    });
});

describe("Given that realtedProductController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.params = { pid: 1, cid: 1 }
        consoleSpy.mockClear();
    });
    afterEach(() => {
        delete req.params;
    });

    test("Get related products successfully", async () => {
        const mockProduct = { _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1};
        const selectMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const populateMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock,
            limit: limitMock,
            populate: populateMock
        }));
        await realtedProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            products: mockProduct,
        });
    });

    test("Error while getting related products", async () => {
        const selectMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const populateMock = jest.fn().mockRejectedValue("Error getting related products");
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            select: selectMock,
            limit: limitMock,
            populate: populateMock
        }));
        await realtedProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "error while geting related product",
            error: "Error getting related products",
        });
    })
});

describe("Given that productCategoryController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        req.params = { slug: "test-slug" }
        consoleSpy.mockClear();
    });
    afterEach(() => {
        delete req.params;
    });
    test("Get products by category successfully", async () => {
        const mockProduct = new categoryModel({ _id: 1, name: 'Product 1', category: { _id: 'cat1', name: 'Category 1' }, quantity: 1});
        jest.spyOn(categoryModel, "findOne").mockImplementation(() => {
            return {name: 'Category 1', slug: 'test-slug'};
        });
        const populateMock = jest.fn().mockResolvedValue(mockProduct);
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            populate: populateMock
        }));
        await productCategoryController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            category: {name: 'Category 1', slug: 'test-slug'},
            products: mockProduct
        });
    });

    test("Error while getting products by category", async () => {
        jest.spyOn(categoryModel, "findOne").mockImplementation(() => {
            return {name: 'Category 1', slug: 'test-slug'};
        });
        const populateMock = jest.fn().mockRejectedValue("Error getting products by category");
        jest.spyOn(productModel, "find").mockImplementation(() => ({
            populate: populateMock
        }));
        await productCategoryController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error While Getting products",
            error: "Error getting products by category",
        });
    })
});

describe("Given that braintreeTokenController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        consoleSpy.mockClear();
    });

    test("Get token successfully", async () => {
        const callbackMock = jest.fn((err, response) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(response);
            }
        });
        const mockResponse = { success: true, clientToken: 'sample-token' };
        let gatewayMock = {
            clientToken: {
              generate: jest.fn()
            },
        };

        gatewayMock.clientToken.generate.mockReturnThis(callbackMock(null, mockResponse));
        braintree.BraintreeGateway = jest.fn().mockImplementation(() => {
            return gatewayMock;
        });

        await braintreeTokenController(req, res);

        expect(res.send).toHaveBeenCalledWith(mockResponse);

        expect(res.status).not.toHaveBeenCalled();
    });

    test("Error while getting token", async () => {
        const callbackMock = jest.fn((err, response) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(response);
            }
        });
        const mockError = new Error("Error getting token");
        let gatewayMock = {
            clientToken: {
              generate: jest.fn()
            },
        };

        gatewayMock.clientToken.generate.mockReturnThis(callbackMock(mockError, null));
        braintree.BraintreeGateway = jest.fn().mockImplementation(() => {
            return gatewayMock;
        });

        await braintreeTokenController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    });
});

describe("Given that brainTreePaymentController is called", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fillProductFormAndMockResponse(true, false, "None");
        consoleSpy.mockClear();
    });

    test("Payment successfully", async () => {
        const callbackMock = jest.fn((err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json({ ok: true });
            }
        });
        const mockResult = { success: true };
        let gatewayMock = {
            transaction: {
              sale: jest.fn().mockResolvedValue(callbackMock(null, mockResult))
            },
        };

        orderModel.prototype.save = jest.fn().mockReturnValue({});
        braintree.BraintreeGateway = jest.fn().mockReturnValue(gatewayMock);

        await brainTreePaymentController({user : {id: 1}}, res);

        expect(res.json).toHaveBeenCalledWith({ok: true});
        expect(res.status).not.toHaveBeenCalled();
    });

    test("Error while payment", async () => {
        const callbackMock = jest.fn((err, response) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json({ ok: true });
            }
        });

        orderModel.prototype.save = jest.fn().mockRejectedValue("Error while payment");
        const mockError = new Error("Error while payment");
        let gatewayMock = {
            transaction: {
              sale: jest.fn().mockResolvedValue(callbackMock(mockError, null)),
            },
        };

        braintree.BraintreeGateway = jest.fn().mockReturnValue(gatewayMock);

        await brainTreePaymentController({user : {id: 1}}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    });
});