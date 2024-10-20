import { test, expect } from "@playwright/test";

test('Search page with no results', async ({ page }) => {
    // Search for non-existing product
    await page.goto('http://localhost:3000/');
    await page.getByLabel('Search').fill('NonExistentProductSearch');
    await page.getByRole('button', { name: 'Search' }).click();

    // Navigate to search page and check that no results are found
    await expect(page).toHaveURL('http://localhost:3000/search');
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Search results');
    const resultsHeader = page.getByText('Search Resuts');
    const results = page.getByText('No Products Found');
    await expect(resultsHeader).toBeVisible();
    await expect(results).toBeVisible();
});

test('Search page with results', async ({ page }) => {
    // Search for existing product
    await page.goto('http://localhost:3000/');
    await page.getByLabel('Search').fill('Product One');
    await page.getByRole('button', { name: 'Search' }).click();

    // Navigate to search page and check that at least one result is found,
    // cannot check for fixed number of products found as it can vary
    await expect(page).toHaveURL('http://localhost:3000/search');
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Search results');
    const productSearchCount = page.getByText(/Found \d+/);
    expect(productSearchCount).toBeVisible();

    // Check that the product being searched is present on the page
    const productsFound = page.locator('//h5[text()="Product One"]/..');
    const moreDetailsButton = productsFound.locator('button:has-text("More Details")');
    const addToCartButton = productsFound.locator('button:has-text("ADD TO CART")');
    await expect(moreDetailsButton).toBeVisible();
    await expect(addToCartButton).toBeVisible();
});
