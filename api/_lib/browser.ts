import { chromium as playwrightChromium, Browser } from 'playwright-core';
import chromium from '@sparticuz/chromium';

export async function launchBrowser(): Promise<Browser> {
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
