import React from 'react';
import { render, fireEvent, waitFor, screen, within } from '@testing-library/react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';
import { expect } from '@jest/globals';

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

describe('Create Category Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the create category page without crashing', () => {
        render(
        <Router>
            <CreateCategory />
        </Router>
        );
        expect(screen.getByRole('heading', { name: 'Manage Category'})).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter new category/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i})).toBeInTheDocument();
        expect(screen.getByText(/name/i)).toBeInTheDocument();
        expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it('inputs should be initially empty', () => {
        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        expect(screen.getByPlaceholderText(/enter new category/i).value).toBe('');
      });

      it('should allow typing for new category', () => {
        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        fireEvent.change(screen.getByPlaceholderText(/enter new category/i), { target: { value: 'Test2' } });
        expect(screen.getByPlaceholderText(/enter new category/i).value).toBe('Test2');
      });

    it('should retrieve all categories available', async () => {
        axios.get.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "All Categories List",
                    "category": [
                        {
                            "_id": "cid_1",
                            "name": "Test",
                            "slug": "test",
                            "__v": 0
                        }
                    ]
                }
        });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        });
    });

    it('should display error message when categories cannot be retrieved', async () => {
        axios.get.mockRejectedValue({
        data:
        {
                "success": false,
                "message": "All Categories List",
                "category": [
                    {
                        "_id": "cid_1",
                        "name": "Test",
                        "slug": "test",
                        "__v": 0
                    }
                ]
            }
        });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            expect(toast.error).toHaveBeenCalledWith('Something wwent wrong in getting catgeory');
        });
    });



    it('should create a category successfully', async () => {
        axios.post.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "new category created",
                    "category": [
                        {
                            "_id": "cid_2",
                            "name": "Test2",
                            "slug": "test2",
                            "__v": 0
                        }
                    ]
                }
        });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        fireEvent.change(screen.getByPlaceholderText(/enter new category/i), { target: { value: 'Test2' } });
        fireEvent.click(screen.getByText('Submit'));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith('Test2 is created');
    })

    it('should display error message when success is false', async () => {
        axios.post.mockResolvedValue({
            data:
                {
                    "success": false,
                    "message": "cannot create category",
                    "category": [
                        {
                            "_id": "cid_2",
                            "name": "Test2",
                            "slug": "test2",
                            "__v": 0
                        }
                    ]
                }
        });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        fireEvent.change(screen.getByPlaceholderText(/enter new category/i), { target: { value: 'Test2' } });
        fireEvent.click(screen.getByText('Submit'));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('cannot create category');
    });

    it('should display error message when a new category cannot be created successfully', async () => {
        axios.post.mockRejectedValue({
            data:
                {
                    "success": false,
                    "message": "cannot create category",
                    "category": [
                        {
                            "_id": "cid_2",
                            "name": "Test2",
                            "slug": "test2",
                            "__v": 0
                        }
                    ]
                }
        });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        fireEvent.change(screen.getByPlaceholderText(/enter new category/i), { target: { value: 'Test2' } });
        fireEvent.click(screen.getByText('Submit'));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('somthing went wrong in input form');
    });

    it('should update a category successfully', async () => {
        axios.get.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "All Categories List",
                    "category": [
                        {
                            "_id": "cid_1",
                            "name": "category1",
                            "slug": "category1",
                            "__v": 0
                        },

                    ]
                }
        });

        axios.put.mockResolvedValue({
            data: {
              success: true,
              message: 'Category updated successfully',
            },
          });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            const editButton = screen.getByText(/edit/i);
            fireEvent.click(editButton);
            const modalInput = screen.getByDisplayValue('category1');
            expect(modalInput).toBeInTheDocument();
            fireEvent.change(modalInput, { target: { value: 'updatedCategory' } });
            const modal = screen.getByRole('dialog');
            const submitButton = within(modal).getByRole('button', { name: /submit/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
              '/api/v1/category/update-category/cid_1',
              { name: 'updatedCategory' }
            );
          });
          expect(toast.success).toHaveBeenCalledWith('updatedCategory is updated');

    })

    it('should display error message when category is not updated successfully', async () => {
        axios.get.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "All Categories List",
                    "category": [
                        {
                            "_id": "cid_1",
                            "name": "category1",
                            "slug": "category1",
                            "__v": 0
                        },

                    ]
                }
        });

        axios.put.mockRejectedValue({
            data: {
              success: false,
              message: 'Category not updated',
            },
          });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            const editButton = screen.getByText(/edit/i);
            fireEvent.click(editButton);
            const modalInput = screen.getByDisplayValue('category1');
            expect(modalInput).toBeInTheDocument();
            fireEvent.change(modalInput, { target: { value: 'updatedCategory' } });
            const modal = screen.getByRole('dialog');
            const submitButton = within(modal).getByRole('button', { name: /submit/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
              '/api/v1/category/update-category/cid_1',
              { name: 'updatedCategory' }
            );
          });
          expect(toast.error).toHaveBeenCalledWith('Somtihing went wrong');

    })

    it('should delete a category successfully', async () => {
        axios.get.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "All Categories List",
                    "category": [
                        {
                            "_id": "cid_1",
                            "name": "category1",
                            "slug": "category1",
                            "__v": 0
                        },

                    ]
                }
        });

        axios.delete.mockResolvedValue({
            data: {
              success: true,
              message: 'Category updated successfully',
            },
          });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            const deleteButton = screen.getByText(/delete/i);
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
              '/api/v1/category/delete-category/cid_1'
            );
          });
          expect(toast.success).toHaveBeenCalledWith(`category is deleted`);

    })

    it('should display error message when category is not deleted successfully', async () => {
        axios.get.mockResolvedValue({
            data:
                {
                    "success": true,
                    "message": "All Categories List",
                    "category": [
                        {
                            "_id": "cid_1",
                            "name": "category1",
                            "slug": "category1",
                            "__v": 0
                        },

                    ]
                }
        });

        axios.delete.mockRejectedValue({
            data: {
              success: false,
              message: 'Category not deleted',
            },
          });

        render(
            <Router>
                <CreateCategory />
            </Router>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            const deleteButton = screen.getByText(/delete/i);
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
              '/api/v1/category/delete-category/cid_1',
            );
          });
          expect(toast.error).toHaveBeenCalledWith('Somtihing went wrong');

    })





})