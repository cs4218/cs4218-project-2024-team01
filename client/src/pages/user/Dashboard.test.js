import React from "react";
import { beforeEach, describe, jest, expect, it } from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, fireEvent, getByRole } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import Dashboard from "./Dashboard";

let mockUser = {
    user: {
        name: "John Doe",
        email: "johndoe@gmail.com",
        password: "password123",
        phone: "123456789",
        address: "123 Woodlands Avenue 6"
    }
};

jest.mock("../../components/Layout", () => ({ title, children }) => (
    <>
      <div>{title}</div>
      <div>{children}</div>
    </>
  )
);

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [mockUser, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));  


describe("Dashboard Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render the Dashboard components", () => {
        const { getByRole } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>
        );
        expect(getByRole('heading', {level: 3, name: mockUser.user.name})).toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.email})).toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.address})).toBeInTheDocument();
    });

});



