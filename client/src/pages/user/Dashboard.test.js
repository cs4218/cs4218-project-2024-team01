import React from "react";
import { beforeEach, describe, jest, expect, it } from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import Dashboard from "./Dashboard";

let mockUser

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
        mockUser = {
            user: {
                name: "John Doe",
                email: "johndoe@gmail.com",
                password: "password123",
                phone: "123456789",
                address: "123 Woodlands Avenue 6"
            }
        };
    });

    it("should render all the Dashboard components if it is available", () => {
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

    it("should render email and address but not email if it is empty ", () => {
        mockUser.user.name = "";

        const { getByRole, queryByRole } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>
        );
        expect(queryByRole('heading', {level: 3, name: "John Doe"})).not.toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.email})).toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.address})).toBeInTheDocument();
    });

    it("should name and address but not email if it is empty ", () => {
        mockUser.user.email = "";

        const { getByRole, queryByRole } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>
        );
        expect(getByRole('heading', {level: 3, name: mockUser.user.name})).toBeInTheDocument();
        expect(queryByRole('heading', {level: 3, name: "johndoe@gmail.com"})).not.toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.address})).toBeInTheDocument();
    });

    it("should name and email but not address if it is empty ", () => {
        mockUser.user.address = "";

        const { getByRole, queryByRole } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>
        );
        expect(getByRole('heading', {level: 3, name: mockUser.user.name})).toBeInTheDocument();
        expect(getByRole('heading', {level: 3, name: mockUser.user.email})).toBeInTheDocument();
        expect(queryByRole('heading', {level: 3, name: "123 Woodlands Avenue 6"})).not.toBeInTheDocument();
    });

});



