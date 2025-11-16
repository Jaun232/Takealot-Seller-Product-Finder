import { chromium as playwrightChromium, Browser } from 'playwright-core';
import chromium from '@sparticuz/chromium';

let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

async function createBrowser(): Promise<Browser> {
  const useServerlessChromium = Boolean(process.env.AWS_REGION || process.env.VERCEL);

  if (useServerlessChromium) {
    const executablePath = await chromium.executablePath();
    const headlessSetting = chromium.headless;
    const headless =
      typeof headlessSetting === 'string'
        ? headlessSetting.toLowerCase() !== 'false'
        : headlessSetting ?? true;

    return playwrightChromium.launch({
      args: chromium.args,
      executablePath,
      headless,
      ignoreDefaultArgs: ['--disable-extensions'],
    });
  }

  return playwrightChromium.launch({
    headless: true,
  });
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  if (!launchPromise) {
    launchPromise = createBrowser()
      .then((browser) => {
        browserInstance = browser;
        browser.once('disconnected', () => {
          browserInstance = null;
        });
        return browserInstance;
      })
      .finally(() => {
        launchPromise = null;
      });
  }

  return launchPromise;
}
