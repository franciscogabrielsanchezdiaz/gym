import { test, expect, type Page } from "@playwright/test";
import type { Session } from "../src/model";

// Read the browser's real IndexedDB, without exposing app internals in production.
async function readSessions(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("hypertrophy-v1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Session[]>((resolve, reject) => {
        const request = database
          .transaction("sessions")
          .objectStore("sessions")
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  });
}

test("registra, recupera y finaliza un entrenamiento completamente sin conexión", async ({
  page,
  context,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Vamos a entrenar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Vamos a por más/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Listo para usar sin conexión", { exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Comenzar entrenamiento", exact: true })
    .evaluate((button) => {
      button.click();
      button.click();
    });
  const entry = page.locator(".active-exercise").first();
  const weight = entry.getByRole("spinbutton", { name: /^Peso serie 1 / });
  await weight.fill("44");
  await entry
    .getByRole("spinbutton", { name: "Repeticiones serie 1", exact: true })
    .fill("10");
  await entry
    .getByRole("spinbutton", { name: "RIR serie 1", exact: true })
    .fill("2");
  await entry
    .getByPlaceholder("Sensaciones, ajustes, técnica…")
    .fill("Prueba real offline");
  await entry
    .getByRole("button", { name: "Completar serie", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect
    .poll(async () => {
      const logs = await readSessions(page);
      return (
        logs[0]?.entries[0]?.sets[0]?.done &&
        logs[0]?.entries[0]?.notes === "Prueba real offline" &&
        logs[0]?.runningSince === null
      );
    })
    .toBe(true);
  const before = await readSessions(page);
  expect(before).toHaveLength(1);
  expect(before[0].entries[0].sets[0].reps).toBe(10);
  expect(before[0].entries[0].sets[0].rir).toBe(2);
  expect(before[0].entries[0].sets[0].kg).toBeCloseTo(44 / 2.2046226218, 6);
  // Close the tab and block network before opening a new one in the same storage context.
  await page.close();
  await context.setOffline(true);
  const offlinePage = await context.newPage();
  offlinePage.on("pageerror", (e) => errors.push(e.message));
  const response = await offlinePage.goto("/");
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(
    offlinePage.getByText("Sin conexión", { exact: true }),
  ).toBeVisible();
  await expect(
    offlinePage.getByText("Listo para usar sin conexión", { exact: true }),
  ).toBeVisible();
  await offlinePage
    .getByRole("button", { name: "Continuar entrenamiento", exact: true })
    .click();
  const offlineEntry = offlinePage.locator(".active-exercise").first();
  await expect(
    offlineEntry.getByRole("spinbutton", { name: /^Peso serie 1 / }),
  ).toHaveValue("44");
  await expect(
    offlineEntry.getByRole("spinbutton", {
      name: "Repeticiones serie 1",
      exact: true,
    }),
  ).toHaveValue("10");
  await expect(
    offlineEntry.getByPlaceholder("Sensaciones, ajustes, técnica…"),
  ).toHaveValue("Prueba real offline");
  await offlinePage
    .getByRole("button", { name: "Reanudar", exact: true })
    .click();
  await offlineEntry
    .getByRole("spinbutton", { name: "Repeticiones serie 2", exact: true })
    .fill("9");
  await offlineEntry
    .getByRole("button", { name: "Completar serie", exact: true })
    .first()
    .click();
  await expect
    .poll(
      async () => (await readSessions(offlinePage))[0].entries[0].sets[1].done,
    )
    .toBe(true);
  await offlinePage
    .getByRole("button", { name: "Finalizar entrenamiento", exact: true })
    .click();
  await offlinePage
    .getByRole("button", { name: "Confirmar y guardar", exact: true })
    .click();
  await expect(
    offlinePage.getByRole("heading", { name: "Tu trabajo, registrado." }),
  ).toBeVisible();
  await expect
    .poll(async () => (await readSessions(offlinePage))[0]?.status)
    .toBe("complete");
  const after = await readSessions(offlinePage);
  expect(after).toHaveLength(1);
  expect(after[0].id).toBe(before[0].id);
  await offlinePage.reload();
  await expect(
    offlinePage.getByRole("button", {
      name: "Continuar entrenamiento",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await readSessions(offlinePage))[0].status).toBe("complete");
  // Each origin/browser profile has independent local data.
  const fresh = await browser.newContext();
  const clean = await fresh.newPage();
  await clean.goto("/");
  await clean
    .getByRole("button", { name: "Vamos a entrenar", exact: true })
    .click();
  expect(await readSessions(clean)).toEqual([]);
  await fresh.close();
  expect(errors).toEqual([]);
});

test("conserva IndexedDB y la caché después de cerrar todo el navegador", async ({
  playwright,
}, testInfo) => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const profileDir = await mkdtemp(join(tmpdir(), "hypertrophy-e2e-"));
  const launch = testInfo.project.use.launchOptions ?? {};
  let persistent = await playwright.chromium.launchPersistentContext(
    profileDir,
    { ...launch, headless: true },
  );
  try {
    const page = await persistent.newPage();
    await page.goto("http://127.0.0.1:4173/");
    await page
      .getByRole("button", { name: "Vamos a entrenar", exact: true })
      .click();
    await expect(
      page.getByText("Listo para usar sin conexión", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Comenzar entrenamiento", exact: true })
      .click();
    const entry = page.locator(".active-exercise").first();
    await entry
      .getByRole("spinbutton", { name: "Repeticiones serie 1", exact: true })
      .fill("11");
    await entry
      .getByRole("button", { name: "Completar serie", exact: true })
      .first()
      .click();
    await expect
      .poll(async () => (await readSessions(page))[0]?.entries[0].sets[0].done)
      .toBe(true);
    const before = await readSessions(page);
    await persistent.close();
    persistent = await playwright.chromium.launchPersistentContext(profileDir, {
      ...launch,
      headless: true,
      offline: true,
    });
    const reopened = await persistent.newPage();
    const response = await reopened.goto("http://127.0.0.1:4173/");
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(
      reopened.getByText("Sin conexión", { exact: true }),
    ).toBeVisible();
    await reopened
      .getByRole("button", { name: "Continuar entrenamiento", exact: true })
      .click();
    expect(await readSessions(reopened)).toEqual(before);
    await expect(
      reopened
        .locator(".active-exercise")
        .first()
        .getByRole("spinbutton", { name: "Repeticiones serie 1", exact: true }),
    ).toHaveValue("11");
  } finally {
    await persistent.close();
    await rm(profileDir, { recursive: true, force: true });
  }
});
