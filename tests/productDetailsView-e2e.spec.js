import { test, expect } from "@playwright/test";

test('View Product Details page', async ({ page }) => {
    // Navigate to the product details page after clicking on "more details" button
    await page.goto('http://localhost:3000/');
    const productToInspect = page.locator('//h5[text()="Product One"]/../..').first();
    await productToInspect.locator('button:has-text("More Details")').click();
    await expect(page).toHaveURL('http://localhost:3000/product/product-one');

    // Check that the product details are rendered correctly
    const productDetailsHeader = page.getByText('PRODUCT DETAILS');
    const productName = page.getByText('Name : Product One');
    const productDescription = page.getByText('Description : This is product 1');
    const productPrice = page.getByText('Price').first();
    const productCategory = page.getByText('Category : Category One');

    await productDetailsHeader.isVisible();
    await productName.isVisible();
    await productDescription.isVisible();
    await productPrice.isVisible();
    await productCategory.isVisible();

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

    await relatedProductDetailsHeader.isVisible();
    await relatedProductName.isVisible();
    await relatedProductDescription.isVisible();
    await relatedProductPrice.isVisible();
    await relatedProductCategory.isVisible();

    await expect(relatedProductDetailsHeader).toBeVisible();
    await expect(relatedProductName).toBeVisible();
    await expect(relatedProductDescription).toBeVisible();
    await expect(relatedProductPrice).toContainText('Price :$20.00');
    await expect(relatedProductCategory).toBeVisible();
});