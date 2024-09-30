import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react';
import axios from 'axios';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import * as router from 'react-router';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
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

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

const navigate = jest.fn();
describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate)
    axios.get.mockResolvedValueOnce({
      data: null
    })
  });
  
  it('renders login form', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    
    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
  });
  it('inputs should be initially empty', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    
    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('');
  });
  
  it('should allow typing email and password', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
  });
  
  it('should login the user successfully', async () => {
    let res = {
      data: {
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      }
    }
    axios.post.mockResolvedValueOnce({
      data: res.data
    });
    navigate.mockImplementationOnce(() => {});
    
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('LOGIN'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });
    expect(localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify(res.data))
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it ('should display error toast on failed login due to invalid credentials', async () => {
    let res = {
      data: { success: false, message: 'Invalid credentials' },
      status: 401
    }
    axios.post.mockResolvedValueOnce({
      data: res.data,
      status: res.status
    });
    let consoleSpy = jest.spyOn(console, 'log');
    
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: '123123' } });
    fireEvent.click(getByText('LOGIN'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });
  
  it('should display error message on failed login due to unhandled exception', async () => {
    axios.post.mockRejectedValueOnce('Unexpected Error');
    let consoleSpy = jest.spyOn(console, 'log');
    
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('LOGIN'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    
    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(consoleSpy).toHaveBeenCalledWith('Unexpected Error');
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should navigate to forgetPassword page when button is clicked', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(getByText('Forgot Password'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(navigate).toHaveBeenCalledWith('/forgot-password');
  })
	
	const cases = [
		{ email: "test@example.com", password: "", caseName: "empty password" },
		{ email: "", password: "password123", caseName: "empty email" },
		{ email: "", password: "", caseName: "empty email and password" }
	]
	cases.forEach(({email, password, caseName}) => {
		it('should not allow form submission with empty fields ' + caseName, async () => {
			const { getByPlaceholderText, getByText } = render(
				<MemoryRouter initialEntries={['/login']}>
					<Routes>
						<Route path="/login" element={<Login />} />
					</Routes>
				</MemoryRouter>
			);
			
			fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: email } });
			fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: password } });
			fireEvent.click(getByText('LOGIN'));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      });
			
			await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(0));
      expect(toast.error).toHaveBeenCalledTimes(0)
      expect(toast.success).toHaveBeenCalledTimes(0)
    })
	})
});
