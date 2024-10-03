import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Products from './Products';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

describe('Products Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the all products list without crashing', () => {
        render(
          <Router>
            <Products />
          </Router>
        );
        expect(screen.getByText('All Products List')).toBeInTheDocument();
      });

      it('should retrieve all products successfully', async () => {
        axios.get.mockResolvedValue({
        data:
            {
                success: true,
                counTotal: 1,
                message: "ALlProducts ",
                products: [
                    {
                        _id: "pid_1",
                        name: "Test",
                        slug: "Test",
                        description: "Test",
                        price: 1,
                        category: {
                            _id: "cid_1",
                            name: "Test",
                            slug: "Test",
                            __v: 0
                        },
                        quantity: 1,
                        createdAt: Date.now().toString(),
                        updatedAt: Date.now().toString(),
                        __v: 0
                    }
                ]
            }
        });

        render(
            <Router>
              <Products />
            </Router>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
            const productLink = screen.getByRole('link', { name: /test/i });
            expect(productLink).toBeInTheDocument();
            const productImage = screen.getByRole('img', { name: /test/i });
            expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/pid_1');
            expect(productImage).toHaveAttribute('alt', 'Test');
            const productTitle = screen.getByText('Test', { selector: 'h5.card-title' });
            const productDescription = screen.getByText('Test', { selector: 'p.card-text' });

            expect(productTitle).toBeInTheDocument();
            expect(productDescription).toBeInTheDocument();

        });
    });

    it('should display error message on failed retrival of all products list', async () => {
        axios.get.mockRejectedValue({
            data:
                {
                    success: false,
                    counTotal: 1,
                    message: "ALlProducts ",
                    products: [
                        {
                            _id: "pid_1",
                            name: "Test",
                            slug: "Test",
                            description: "Test",
                            price: 1,
                            category: {
                                _id: "cid_1",
                                name: "Test",
                                slug: "Test",
                                __v: 0
                            },
                            quantity: 1,
                            createdAt: Date.now().toString(),
                            updatedAt: Date.now().toString(),
                            __v: 0
                        }
                    ]
                }
            });

        render(
            <Router>
              <Products />
            </Router>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
            expect(toast.error).toHaveBeenCalledWith('Something Went Wrong');
        });
    });


})