import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { BrowserRouter as Router, MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import UpdateProduct from './UpdateProduct';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
  }));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
  }));

describe('Update Product Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the update product page without crashing', () => {
        render(
          <Router>
            <UpdateProduct />
          </Router>
        );
        expect(
          screen.getByRole("heading", { name: "Update Product" })
        ).toBeInTheDocument();

      });

    it('should retrieve the chosen product successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: null,
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByText(/upload Photo/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a Price/i).value).toBe("1");
        expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe("1");
        expect(screen.getByTitle("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "UPDATE PRODUCT" })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "DELETE PRODUCT" })).toBeInTheDocument();
      });
    });

    it('should update the chosen product successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: null,
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      axios.put.mockResolvedValue({
        data: {
          success: true,
          message: 'Product updated successfully',
        },
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "UPDATE PRODUCT" })).toBeInTheDocument();

      });

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/product/update-product/pid_1',
          expect.any(FormData)
        );
        expect(toast.success).toHaveBeenCalledWith('Product Updated Successfully');
      });

    });

    it('should display error message if the chosen product is not updated successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                },
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        if (url === '/api/v1/product/update-product/pid_1') {
          return Promise.reject({
            data: {
              success: false,
              message: "Cannot update product",
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      // axios.put.mockRejectedValue({
      //   data: {
      //     success: false,
      //     message: 'Product not updated successfully',
      //   },
      // });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "UPDATE PRODUCT" })).toBeInTheDocument();

      });
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/product/update-product/pid_1',
          expect.any(FormData)
        );
        expect(toast.error).toHaveBeenCalledWith('something went wrong');
      });

    });

    it('should display error message if the chosen product is not deleted successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                },
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        if (url === '/api/v1/product/delete-product/pid_1') {
          return Promise.reject({
            data: {
              success: false,
              message: "Cannot delete product",
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "DELETE PRODUCT" })).toBeInTheDocument();

      });
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      jest.spyOn(window, 'prompt').mockReturnValue("Yes");
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          '/api/v1/product/delete-product/pid_1'
        );
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });

    });

    it('should delete the chosen product successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                },
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }

        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      axios.delete.mockResolvedValue({
        data: {
          success: true,
          message: 'Product deleted successfully',
        },
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "DELETE PRODUCT" })).toBeInTheDocument();

      });
      jest.spyOn(window, 'prompt').mockReturnValue("Yes");
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          '/api/v1/product/delete-product/pid_1'
        );
        expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
      });

    });

    it('should not delete the chosen product successfully if there is no input to the window prompt', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                },
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }

        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      axios.delete.mockResolvedValue({
        data: {
          success: false,
          message: 'Product not deleted successfully',
        },
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "DELETE PRODUCT" })).toBeInTheDocument();

      });
      jest.spyOn(window, 'prompt').mockReturnValue("");
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");


      expect(axios.delete).not.toHaveBeenCalled()
    });

    it('should not delete the chosen product successfully if the input is no to the window prompt', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/product/get-product/Test') {
          return Promise.resolve({
            data: {
              success: true,
              message: "Single Product Fetched",
              product: {
                _id: "pid_1",
                name: "Test",
                slug: "Test",
                description: "Test",
                price: 1,
                category: {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                },
                quantity: 1,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                __v: 0
              }
            }
          });
        }
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }

        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      axios.delete.mockResolvedValue({
        data: {
          success: false,
          message: 'Product not deleted successfully',
        },
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/Test');
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe("Test");
        expect(screen.getByPlaceholderText(/write a description/i).value).toBe("Test");
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: "DELETE PRODUCT" })).toBeInTheDocument();

      });
      jest.spyOn(window, 'prompt').mockReturnValue("no");
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");


      expect(axios.delete).not.toHaveBeenCalled();
    });


    it('should retrieve the categories list successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/category/get-category') {
          return Promise.resolve({
            data: {
              success: true,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
      });
    });

    it('should display error message when the categories list is not retrieved successfully', async () => {
      axios.get.mockImplementation((url) => {
        if (url === '/api/v1/category/get-category') {
          return Promise.reject({
            data: {
              success: false,
              message: "All Categories List",
              category: [
                {
                  _id: "cid_1",
                  name: "category1",
                  slug: "category1",
                  __v: 0
                }
              ]
            }
          });
        }
        return Promise.reject(new Error('Not Found'));
      });

      render(
        <MemoryRouter initialEntries={['/product/Test']}>
          <Routes>
            <Route path="/product/:slug" element={<UpdateProduct />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        expect(toast.error).toHaveBeenCalledWith('Something went wrong in getting catgeory');
      });
    });

})