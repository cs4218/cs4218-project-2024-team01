import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import * as SearchContext from "../context/search";
import Search from './Search';

jest.mock("axios");

jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock('./../components/Layout', () => ({children, title}) => (
    <>
        <title>{title}</title>
        {children}
    </>
));

describe("<Search/>", () => {
    afterEach(() => {
        jest.clearAllMocks();
    })
    it("Should render Search correctly", () => {
        //Arrange
        jest.spyOn(SearchContext, "useSearch").mockImplementation(() => [{keywords: "", results: []}, () => {}]);
        render(
            <Search/>
        );

        //Act
        const searchInputTitle = screen.getByText("Search results");

        //Assert
        expect(searchInputTitle).toBeInTheDocument();
    });

    it("Should display no results found when no products found", () => {
        //Arrange
        jest.spyOn(SearchContext, "useSearch").mockImplementation(() => [{keywords: "", results: []}, () => {}]);
        render(
            <Search/>
        );

        //Act
        const searchResultDisplay = screen.getByText("No Products Found");

        //Assert
        expect(searchResultDisplay).toBeInTheDocument();
    });

    it("Should display results found when products found", () => {
        //Arrange
        const mockProducts = [
            {_id: 1, name: "test1", description: "test1", price: 1}, 
            {_id: 2, name: "test2", description: "test2", price: 2}, 
            {_id: 3, name: "test3", description: "test3", price: 3}, 
        ];

        jest.spyOn(SearchContext, "useSearch").mockImplementation(() => [{keywords: "", results: mockProducts}, () => {}]);
        render(
            <Search/>
        );

        //Act
        const searchResultDisplay = screen.getByText("Found 3");
        const testItem1 = screen.getByText("test1");
        const testItem2 = screen.getByText("test2");
        const testItem3 = screen.getByText("test3");

        //Assert
        expect(searchResultDisplay).toBeInTheDocument();
        expect(testItem1).toBeInTheDocument();
        expect(testItem2).toBeInTheDocument();
        expect(testItem3).toBeInTheDocument();
    });

});