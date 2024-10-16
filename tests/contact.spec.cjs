const { test, expect } = require('@playwright/test');

test('Contact page', async ({ page }) => {
    // Go to the contact page after clicking on the contact link at bottom of page
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL('http://localhost:3000/contact');
});

test('Contact page is rendered correctly', async ({ page }) => {
    // Navigate to the contact page
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Contact' }).click();

    //Check that the header and subheader is present on the contact page
    const contactPageHeader = page.getByText('CONTACT US');
    const contactPageSubHeader = page.getByText('For any query or info about product, feel free to call anytime. We are available 24X7.')
    expect(contactPageHeader).toBeVisible();
    expect(contactPageSubHeader).toBeVisible();
});