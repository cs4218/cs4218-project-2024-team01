import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as router from 'react-router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from './Header';
import { useAuth } from '../context/auth';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [{
    success: true,
    user: { id: 1, name: 'John Doe', email: 'test@example.com', role: 0 },
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
    jest.clearAllMocks();
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate)
    // For useCategory hook
    axios.get.mockResolvedValueOnce({
      data: {
        category: [{
          slug: 'test-category',
          name: 'Test Category',
        }]
      }
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

  const navigateReturnObj = {"preventScrollReset": undefined, "relative": undefined, "replace": false, "state": undefined, "unstable_viewTransition": undefined}
  it('should navigate to user dashboard', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Header />} />
        </Routes>
      </MemoryRouter>);

    const dashboardButton = getByText('Dashboard');
    fireEvent.click(dashboardButton);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/dashboard/user", navigateReturnObj);
  })

  it('should navigate to admin dashboard', async () => {
    useAuth.mockReturnValueOnce([{
      success: true,
      user: { id: 1, name: 'John Doe', email: 'test@example.com', role: 1 },
      token: 'mockToken'
    }])
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Header />} />
        </Routes>
      </MemoryRouter>);

    const dashboardButton = getByText('Dashboard');
    fireEvent.click(dashboardButton);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/dashboard/admin", navigateReturnObj);
  })
});