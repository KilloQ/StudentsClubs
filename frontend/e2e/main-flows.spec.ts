import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/clubs/categories/list", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(["Все", "Спортивные"]) });
  });

  await page.route("**/clubs/?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ id: 101, title: "Football Club", category: "Спортивные", image_url: null }],
        total: 1,
        page: 1,
        page_size: 12,
      }),
    });
  });

  await page.route("**/external/weather?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ provider: "openweathermap", city: "Москва", temp_c: 14, feels_like_c: 12, condition: "Ясно" }),
    });
  });
});

test("catalog filtering and pagination smoke", async ({ page }) => {
  await page.goto("/clubs");
  await expect(page.getByText("Каталог кружков")).toBeVisible();
  await expect(page.getByText("Football Club")).toBeVisible();
  await page.getByPlaceholder("Поиск по названию, описанию, категории").fill("football");
  await expect(page.getByText("Страница 1")).toBeVisible();
});

test("session expiration redirects to login", async ({ page }) => {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "Unauthorized" }) });
  });
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "refresh expired" }) });
  });

  await page.addInitScript(() => {
    localStorage.setItem("access_token", "expired-access");
    localStorage.setItem("refresh_token", "expired-refresh");
  });

  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/login/);
});

test("api failure shows error message", async ({ page }) => {
  await page.route("**/external/weather?**", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "upstream unavailable" }) });
  });

  await page.goto("/clubs");
  await expect(page.getByText(/upstream unavailable/i)).toBeVisible();
});
