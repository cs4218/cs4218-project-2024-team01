import React from "react";
import { describe, expect, it} from '@jest/globals';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import UserMenu from "./UserMenu";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock("./Layout", () => ({ title, children }) => (
    <>
      <div>{title}</div>
      <div>{children}</div>
    </>
  )
);

describe("UserMenu Component", () => {

    it("should render the UserMenu components", () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route path="/dashboard" element={<UserMenu />} />
                </Routes>
            </MemoryRouter>
        );
        expect(getByText("Dashboard")).toBeInTheDocument();
        expect(getByText("Profile")).toBeInTheDocument();
        expect(getByText("Orders")).toBeInTheDocument();

        expect(getByText("Profile").closest('a')).toHaveAttribute('href', '/dashboard/user/profile');
        expect(getByText("Orders").closest('a')).toHaveAttribute('href', '/dashboard/user/orders');

    });

});