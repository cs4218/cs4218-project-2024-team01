import React from 'react';
import { describe, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Contact from './Contact';

jest.mock('./../components/Layout', () => ({children, title}) => (
    <>
        <title>{title}</title>
        {children}
    </>
));

describe("Should display contact page correctly", () => {
    it("Should display contact title", async () => {
        //Arrange
        render(
            <Contact />
        );

        //Act
        const title = screen.getByText("CONTACT US");

        //Assert
        expect(title).toBeInTheDocument();
    });

    it("Should display contact information", async () => {
        //Arrange
        render(
            <Contact />
        );

        //Act
        const paragraphs = screen.getAllByText((content, element) =>
            element.tagName.toLowerCase() === 'p' && element.classList.contains('mt-3')
        );
        const website = screen.getByText(/www.help@ecommerceapp.com/i);
        const number1 = screen.getByText(/012-3456789/i);
        const number2 = screen.getByText(/1800-0000-0000/i);
        const descriptionText = screen.getByText("For any query or info about product, feel free to call anytime. We are available 24X7.");

        //Assert
        expect(paragraphs).toHaveLength(3);
        expect(website).toBeInTheDocument();
        expect(number1).toBeInTheDocument();
        expect(number2).toBeInTheDocument();
        expect(descriptionText).toBeInTheDocument();
    });
});