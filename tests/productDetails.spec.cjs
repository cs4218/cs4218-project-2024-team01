const { test, expect } = require('@playwright/test');

test('Product Details page', async ({ page }) => {

    // Navigate to the product details page after clicking on "more details" button
    await page.goto('http://localhost:3000/');
    const productToInspect = page.locator('//h5[text()="Test"]/../..').first();
    await productToInspect.locator('button:has-text("More Details")').click();
    await expect(page).toHaveURL('http://localhost:3000/product/Test');

    // Check that the product details are rendered correctly
    const productDetailsHeader = page.getByText('PRODUCT DETAILS');
    const productName = page.getByText('Name : Test');
    const productDescription = page.getByText('Description : Test');
    const productPrice = page.getByText('Price :$1.00');
    const productCategory = page.getByText('Category : Test');
    await expect(productDetailsHeader).toBeVisible();
    await expect(productName).toBeVisible();
    await expect(productDescription).toBeVisible();
    await expect(productCategory).toBeVisible();

    // Navigate to the product details page of related products
    const relatedProduct = page.locator('//h5[text()="Test2"]/../..');
    await relatedProduct.locator('button:has-text("More Details")').click();
    await expect(page).toHaveURL('http://localhost:3000/product/Test2');

    // Check that the product details are rendered correctly
    const relatedProductDetailsHeader = page.getByText('PRODUCT DETAILS');
    const relatedProductName = page.getByText('Name : Test2');
    const relatedProductDescription = page.getByText('Description : Test2');
    const relatedProductPrice = page.getByText('Price :$1.00');
    const relatedProductCategory = page.getByText('Category : Test');
    await expect(relatedProductDetailsHeader).toBeVisible();
    await expect(relatedProductName).toBeVisible();
    await expect(relatedProductDescription).toBeVisible();
    await expect(relatedProductCategory).toBeVisible();
});