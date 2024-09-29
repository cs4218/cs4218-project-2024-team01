import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react';
import axios from 'axios';
import {MemoryRouter, Routes, Route, useNavigate} from 'react-router-dom';
import * as router from 'react-router';
import {act} from 'react-dom/test-utils';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';
import { RegisterFormBuilder } from '../../testutils/register/registerFormBuilder';

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
describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
		jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate)
		axios.get.mockResolvedValueOnce({
      data: null
    })
  });
	
	it('renders registration form', async () => {
		const {getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={['/register']}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
		
		expect(getByText("REGISTER FORM")).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument()
		expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument()
	})
	
	it('inputs should be initially empty', async () => {
		const {getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={['/register']}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
		
		expect(getByText("REGISTER FORM")).toBeInTheDocument()
		expect(getByPlaceholderText('Enter Your Name').value).toBe("")
		expect(getByPlaceholderText('Enter Your Email').value).toBe("")
		expect(getByPlaceholderText('Enter Your Password').value).toBe("")
		expect(getByPlaceholderText('Enter Your Phone').value).toBe("")
		expect(getByPlaceholderText('Enter Your Address').value).toBe("")
		expect(getByPlaceholderText('Enter Your DOB').value).toBe("")
		expect(getByPlaceholderText('What is Your Favorite sports').value).toBe("")
	})
	
	it('should allow typing registration fields', async () => {
		const {getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={['/register']}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);
		
		fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
		fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
		fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
		fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
		fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
		fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
		fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

		await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
		
		expect(getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
		expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
		expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
		expect(getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
		expect(getByPlaceholderText('Enter Your Address').value).toBe('123 Street');
		expect(getByPlaceholderText('Enter Your DOB').value).toBe('2000-01-01');
		expect(getByPlaceholderText('What is Your Favorite sports').value).toBe('Football');
	});
  
  it('should register the user successfully', async () => {
    axios.post = jest.fn().mockResolvedValueOnce({ data: { success: true } });
    
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    
    fireEvent.click(getByText('REGISTER'));

		await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
		expect(useNavigate).toHaveBeenCalled()
  });

	it('should display error message on unsuccessful registration', async () => {
		axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already exists' } });
		let consoleSpy = jest.spyOn(console, 'log')
		
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={['/register']}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);
		
		fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
		fireEvent.click(getByText('REGISTER'));

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(consoleSpy).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith('User already exists');
	})
  
  it('should display error message on unexpected error', async () => {
    axios.post.mockRejectedValueOnce('Unexpected error');
		let consoleSpy = jest.spyOn(console, 'log')
    
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    
    fireEvent.click(getByText('REGISTER'));

		await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(consoleSpy).toHaveBeenCalledWith('Unexpected error');
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });
	
	const testCases = [
		new RegisterFormBuilder().withName("").build(),
		new RegisterFormBuilder().withEmail("").build(),
		new RegisterFormBuilder().withPassword("").build(),
		new RegisterFormBuilder().withPhone("").build(),
		new RegisterFormBuilder().withAddress("").build(),
		new RegisterFormBuilder().withDOB("").build(),
		new RegisterFormBuilder().withAnswer("").build(),
	];
	
	testCases.forEach(reqObj => {
		it("should not allow form submission with empty fields", async () => {
			const {getByText, getByPlaceholderText} = render(
				<MemoryRouter initialEntries={['/register']}>
					<Routes>
						<Route path="/register" element={<Register/>}/>
					</Routes>
				</MemoryRouter>
			);
			
			fireEvent.change(getByPlaceholderText('Enter Your Name'), {target: {value: reqObj.name}});
			fireEvent.change(getByPlaceholderText('Enter Your Email'), {target: {value: reqObj.email}});
			fireEvent.change(getByPlaceholderText('Enter Your Password'), {target: {value: reqObj.password}});
			fireEvent.change(getByPlaceholderText('Enter Your Phone'), {target: {value: reqObj.phone}});
			fireEvent.change(getByPlaceholderText('Enter Your Address'), {target: {value: reqObj.address}});
			fireEvent.change(getByPlaceholderText('Enter Your DOB'), {target: {value: reqObj.DOB}});
			fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {target: {value: reqObj.answer}});
			
			fireEvent.click(getByText('REGISTER'));

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});
			
			await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(0));
			expect(toast.error).toHaveBeenCalledTimes(0)
			expect(toast.success).toHaveBeenCalledTimes(0)
		})
	})
});
