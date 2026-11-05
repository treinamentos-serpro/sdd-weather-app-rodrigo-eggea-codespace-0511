import { expect, type Page, test } from '@playwright/test';

async function mockLisbonWeather(page: Page) {
  await page.route('https://geocoding-api.open-meteo.com/v1/search**', async (route) => {
    const requestUrl = new URL(route.request().url());
    expect(requestUrl.searchParams.get('name')).toBe('Lisboa');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 2267057,
            name: 'Lisboa',
            country: 'Portugal',
            admin1: 'Lisboa',
            latitude: 38.7223,
            longitude: -9.1393,
          },
        ],
      }),
    });
  });

  await page.route('https://api.open-meteo.com/v1/forecast**', async (route) => {
    const requestUrl = new URL(route.request().url());
    expect(requestUrl.searchParams.get('latitude')).toBe('38.7223');
    expect(requestUrl.searchParams.get('longitude')).toBe('-9.1393');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        timezone: 'Europe/Lisbon',
        current: {
          time: '2026-11-05T08:00',
          temperature_2m: 0,
          weather_code: 0,
          relative_humidity_2m: 68,
          wind_speed_10m: 12,
          precipitation: 0,
          surface_pressure: 1012,
        },
        daily: {
          time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
          weather_code: [0, 1, 2, 3, 61],
          temperature_2m_min: [-2, 0, 1, 3, 5],
          temperature_2m_max: [8, 10, 12, 14, 16],
          precipitation_probability_max: [0, 10, 20, 35, 75],
        },
      }),
    });
  });
}

test('busca cidade, exibe previsão de cinco dias e alterna para Fahrenheit', async ({ page }) => {
  await mockLisbonWeather(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Próximos 5 dias' })).toBeVisible();
  await expect(page.getByText('0 °C')).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();

  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('32 °F')).toBeVisible();
});

test('mostra estado vazio quando o geocoding não retorna results', async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Nárnia');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Nenhuma cidade encontrada para “Nárnia”' }),
  ).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Buscar cidade' })).toBeVisible();
});

test('renderiza o clima no viewport mobile de 375 × 812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockLisbonWeather(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Próximos 5 dias' })).toBeVisible();
  await expect(page.getByText('0 °C')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 375);
});
