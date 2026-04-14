const { expect } = require('@playwright/test');

async function installRuntimeGuards(page, baseURL) {
  const origin = new URL(baseURL).origin;
  const consoleErrors = [];
  const sameOriginFailures = [];
  const pageErrors = [];

  await page.route(/^https?:\/\//, async (route) => {
    const url = route.request().url();
    if (url.startsWith(origin)) {
      await route.continue();
      return;
    }

    await route.abort();
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('Failed to load resource')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(origin) && response.status() >= 400) {
      sameOriginFailures.push(`${response.status()} ${url}`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith(origin)) {
      sameOriginFailures.push(`requestfailed ${url}`);
    }
  });

  return {
    assertClean() {
      expect(consoleErrors, 'unexpected console errors').toEqual([]);
      expect(sameOriginFailures, 'unexpected same-origin request failures').toEqual([]);
      expect(pageErrors, 'unexpected uncaught page errors').toEqual([]);
    },
  };
}

async function stabilizeVisualState(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

module.exports = {
  installRuntimeGuards,
  stabilizeVisualState,
};
