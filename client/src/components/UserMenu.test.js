import React from "react";
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, fireEvent, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import UserMenu from "./UserMenu";
import axios from "axios";
import toast from "react-hot-toast";
import Profile from "../pages/user/Profile";
import Orders from "../pages/user/Orders";

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock("./Layout", () => ({ title, children }) => (
    <>
      <div>{title}</div>
      <div>{children}</div>
    </>
  )
);

jest.mock("../pages/user/Profile", () => () => <div>USER PROFILE</div>);

jest.mock("../pages/user/Orders", () => () => <div>All Orders</div>);

describe("UserMenu Component", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render the UserMenu components", () => {
        const { getByText, queryByText } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<UserMenu />} />
                </Routes>
            </MemoryRouter>
        );
        expect(getByText("Dashboard")).toBeInTheDocument();
        expect(getByText("Profile")).toBeInTheDocument();
        expect(getByText("Orders")).toBeInTheDocument();
        expect(queryByText("USER PROFILE")).not.toBeInTheDocument();
        expect(queryByText("All Orders")).not.toBeInTheDocument();

        expect(getByText("Profile").closest('a')).toHaveAttribute('href', '/dashboard/user/profile');
        expect(getByText("Orders").closest('a')).toHaveAttribute('href', '/dashboard/user/orders');

    });

    it("should navigate to Profile page", () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<UserMenu />} />
                    <Route path="/dashboard/user/profile" element={<Profile/>} />
                </Routes>
            </MemoryRouter>
        );
        fireEvent.click(getByText("Profile"));
        expect(getByText("USER PROFILE")).toBeInTheDocument();
    });

    it("should navigate to Orders page", () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<UserMenu />} />
                    <Route path="/dashboard/user/orders" element={<Orders/>} />
                </Routes>
            </MemoryRouter>
        );
        fireEvent.click(getByText("Orders"));
        expect(getByText("All Orders")).toBeInTheDocument();
    });

});