import { expect, test, type Page } from '@playwright/test';

/** Smoke test (BUMILAPIS.md 4.8): every route opens and the cross-module flows work. */
const routes: [string, RegExp][] = [
  ['#/lapisan-batuan', /Lapisan Batuan 3D/],
  ['#/kolom', /Kolom Stratigrafi/],
  ['#/formasi', /Formasi/],
  ['#/sedimentasi', /Simulasi Sedimentasi/],
  ['#/interpretasi', /Lingkungan Pengendapan/],
  ['#/glosarium', /Glosarium/],
  ['#/tentang', /Tentang/],
];

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    // WebGL warnings from the software renderer in CI are not application errors
    if (m.type() === 'error' && !/WebGL|GPU|swiftshader|GL_/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bl-onboarded', '1'));
});

test('every route opens with its heading and without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();
  for (const [hash, heading] of routes) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  }
  expect(errors).toEqual([]);
});

test('explore: a layer can be selected from the list and its panel has six tabs', async ({ page }) => {
  await page.goto('./#/');
  await page.getByRole('button', { name: /Pilih dan fokus ke Inti luar/ }).click();
  await expect(page).toHaveURL(/outer-core/);
  await expect(page.getByRole('tab')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: /Inti luar/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');
});

test('search finds layers and glossary terms', async ({ page }) => {
  await page.goto('./#/glosarium');
  await page.getByRole('button', { name: 'Buka pencarian' }).click();
  await page.getByRole('dialog').getByRole('combobox').or(page.getByRole('dialog').getByRole('textbox')).first().fill('moho');
  await expect(page.getByRole('dialog')).toContainText(/Moho/);
});

test('strata: virtual well → column', async ({ page }) => {
  await page.goto('./#/lapisan-batuan?skenario=reverse-fault');
  await page.getByRole('button', { name: /Bor sumur di tengah blok/ }).click();
  await expect(page.getByText(/Ada lapisan yang terulang/)).toBeVisible();
  await page.getByRole('button', { name: /Kirim ke Kolom Stratigrafi/ }).click();
  await expect(page).toHaveURL(/kolom\?kolom=sumur-/);
  await expect(page.getByRole('heading', { name: /Sumur virtual/ })).toBeVisible();
});

test('sedimentation preset → well → column → interpretation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // the model then runs to the end at once
  await page.goto('./#/sedimentasi?sim=cekungan&preset=delta');
  await expect(page.getByText(/1\.500 \/ 1\.500 ribu tahun/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Progradasi: garis pantai maju/)).toBeVisible();
  await page.getByRole('button', { name: /Kirim ke Kolom Stratigrafi/ }).click();
  await expect(page).toHaveURL(/kolom\?kolom=simulasi-/);
  await page.getByRole('button', { name: /Interpretasikan kolom ini/ }).click();
  await expect(page).toHaveURL(/interpretasi\?kolom=simulasi-/);
  await expect(page.getByText(/Pola butir: Mengasar ke atas/)).toBeVisible();
});

test('sedimentation: settling tube and Hjulström tabs render', async ({ page }) => {
  await page.goto('./#/sedimentasi?sim=tabung');
  await expect(page.getByRole('table')).toContainText('Pasir kasar');
  await page.getByRole('tab', { name: 'Saluran arus' }).click();
  await expect(page.getByText(/Erosi: arus cukup kuat/)).toBeVisible();
  await page.getByRole('button', { name: 'Kerikil' }).click();
  await expect(page.getByText(/Pengendapan: arus terlalu lemah/)).toBeVisible();
});

test('interpretation: example observation and case-study column', async ({ page }) => {
  await page.goto('./#/interpretasi');
  await page.getByRole('button', { name: /Batupasir–serpih berurutan Bouma/ }).click();
  await expect(page.getByRole('article').first()).toContainText('Lereng / kipas bawah laut');
  await page.goto('./#/interpretasi?kolom=south-sumatra');
  await expect(page.getByText(/transgresi \(air makin dalam\) sampai interval terdalam/)).toBeVisible();
});

test('formations link to their column', async ({ page }) => {
  await page.goto('./#/formasi/gumai');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Gumai');
  await page.getByRole('link', { name: /lihat di kolom/i }).or(page.getByRole('button', { name: /lihat di kolom/i })).first().click();
  await expect(page).toHaveURL(/kolom/);
});
