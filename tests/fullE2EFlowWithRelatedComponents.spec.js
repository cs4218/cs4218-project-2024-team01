import { test, expect } from "@playwright/test";

// Flow for this e2e test: User starts from the home page, then proceed to search for an non-existing product.
// The product is not found, and user navigates back to home page to see more details of an existing product,
// navigating them to the productDetails page. User then click to see more details of a related product,
// before clicking on the Contact link at the bottom of the page to navigate to the Contact page to see
// the contact details. 

test('Full E2E Flow', async ({ page }) => {
    // Start from the homepage
    await page.goto('http://localhost:3000/');

    // User tries to search for non-existing product
    await page.getByLabel('Search').fill('NonExistentProductSearch');
    await page.getByRole('button', { name: 'Search' }).click();

    // Navigate to search page and check that no results are found
    await expect(page).toHaveURL('http://localhost:3000/search');
    const resultsHeader = page.getByText('Search Resuts');
    const results = page.getByText('No Products Found');
    await expect(resultsHeader).toBeVisible();
    await expect(results).toBeVisible();

    // User then navigates back to the home page
    await page.getByRole('link', { name: 'Home' }).click();

    // Assert that user is on the home page
    await expect(page).toHaveURL('http://localhost:3000/');
    const pageTitle = page.getByText('All Products');
    await pageTitle.isVisible();
    expect(pageTitle).toBeVisible();

    // User clicks on a product on the home page to view more details
    const productToInspect = page.locator('//h5[text()="Product One"]/../..').first();
    await productToInspect.locator('button:has-text("More Details")').click();
    await expect(page).toHaveURL('http://localhost:3000/product/product-one');

    // Check that the product details are rendered correctly
    const productDetailsHeader = page.getByText('PRODUCT DETAILS');
    const productName = page.getByText('Name : Product One');
    const productDescription = page.getByText('Description : This is product 1');
    const productPrice = page.getByText('Price').first();
    const productCategory = page.getByText('Category : Category One');
    await expect(productDetailsHeader).toBeVisible();
    await expect(productName).toBeVisible();
    await expect(productDescription).toBeVisible();
    await expect(productPrice).toContainText('Price :$10.00');
    await expect(productCategory).toBeVisible();

    // Navigate to the product details page of related products
    const relatedProduct = page.locator('//h5[text()="Product Two"]/../..');
    await relatedProduct.locator('button:has-text("More Details")').click();
    await expect(page).toHaveURL('http://localhost:3000/product/product-two');

    // Check that the product details are rendered correctly
    const relatedProductDetailsHeader = page.getByText('PRODUCT DETAILS');
    const relatedProductName = page.getByText('Name : Product Two');
    const relatedProductDescription = page.getByText('Description : This is product 2');
    const relatedProductPrice = page.getByText('Price').first();
    const relatedProductCategory = page.getByText('Category : Category One');
    await expect(relatedProductDetailsHeader).toBeVisible();
    await expect(relatedProductName).toBeVisible();
    await expect(relatedProductDescription).toBeVisible();
    await expect(relatedProductPrice).toContainText('Price :$20.00');
    await expect(relatedProductCategory).toBeVisible();

    // User then clicks on the contact link at the bottom of the page to find out more
    // on the contact details
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL('http://localhost:3000/contact');

    //Check that the header and subheader is present on the contact page
    const contactPageHeader = page.getByText('CONTACT US');
    const contactPageSubHeader = page.getByText('For any query or info about product, feel free to call anytime. We are available 24X7.');
    const contactPageEmail = page.getByText('www.help@ecommerceapp.com');
    const contactPageNumber = page.getByText('012-3456789');
    const contactPageTollFreeNumber = page.getByText('1800-0000-0000');

    await contactPageHeader.isVisible();
    await contactPageSubHeader.isVisible();
    await contactPageEmail.isVisible();
    await contactPageNumber.isVisible();
    await contactPageTollFreeNumber.isVisible();

    expect(contactPageHeader).toBeVisible();
    expect(contactPageSubHeader).toBeVisible();
    expect(contactPageEmail).toBeVisible();
    expect(contactPageNumber).toBeVisible();
    expect(contactPageTollFreeNumber).toBeVisible();

});