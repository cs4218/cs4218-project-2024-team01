import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as router from 'react-router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from './Header';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [{
    success: true,
    user: { id: 1, name: 'John Doe', email: 'test@example.com' },
    token: 'mockToken'
  }, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

const navigate = jest.fn();
describe('Header component', () => {
  beforeEach(() => {
    jest.mock('../context/auth', () => ({
      useAuth: jest.fn(() => [{
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      }, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
    }));

    jest.clearAllMocks();
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate)
    axios.get.mockResolvedValueOnce({
      data: null
    })
  });
  it('should logout successfully', async () => {
    let localStorageSpy = jest.spyOn(window.localStorage, 'removeItem');
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Header />} />
        </Routes>
      </MemoryRouter>);
    const logoutButton = getByText('Logout');
    fireEvent.click(logoutButton);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(localStorageSpy).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });

  it('should logout without auth in local storage', async () => {    
    let localStorageSpy = jest.spyOn(window.localStorage, 'removeItem');
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Header />} />
        </Routes>
      </MemoryRouter>);
    const logoutButton = getByText('Logout');
    fireEvent.click(logoutButton);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(localStorageSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });
});