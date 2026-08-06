import { chromium } from 'playwright';

const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 30000 });
  ok('App loads', true, page.url());

  const a11yBtn = page.getByRole('button', { name: /open accessibility toolbar/i });
  await a11yBtn.waitFor({ timeout: 15000 });
  await a11yBtn.click();
  ok('Accessibility toolbar opens', await page.getByText('Hearing & Captions').isVisible());

  const preferSwitch = page.getByRole('switch', { name: /prefer captions/i });
  await preferSwitch.click();
  await page.waitForTimeout(300);
  const preferOn =
    (await preferSwitch.getAttribute('data-state')) === 'checked' ||
    (await preferSwitch.getAttribute('aria-checked')) === 'true';
  const hasPreferClass = await page.evaluate(() =>
    document.documentElement.classList.contains('prefer-captions'),
  );
  ok('Prefer captions toggles on', preferOn && hasPreferClass, `class=${hasPreferClass}`);

  const visualSwitch = page.getByRole('switch', { name: /visual alerts/i });
  await visualSwitch.click();
  await page.waitForTimeout(200);
  const visualOn =
    (await visualSwitch.getAttribute('data-state')) === 'checked' ||
    (await visualSwitch.getAttribute('aria-checked')) === 'true';
  const hasVisualClass = await page.evaluate(() =>
    document.documentElement.classList.contains('visual-alerts-on'),
  );
  ok('Visual alerts toggles on', visualOn && hasVisualClass);

  const hapticSwitch = page.getByRole('switch', { name: /haptic feedback/i });
  await hapticSwitch.click();
  await page.waitForTimeout(200);
  const hapticOn =
    (await hapticSwitch.getAttribute('data-state')) === 'checked' ||
    (await hapticSwitch.getAttribute('aria-checked')) === 'true';
  ok('Haptic feedback toggles on', hapticOn);

  const stored = await page.evaluate(() => ({
    captions: localStorage.getItem('prefer-captions'),
    visual: localStorage.getItem('visual-alerts'),
    haptic: localStorage.getItem('haptic-feedback'),
  }));
  ok(
    'Prefs saved to localStorage',
    stored.captions === 'true' && stored.visual === 'true' && stored.haptic === 'true',
    JSON.stringify(stored),
  );

  const flashPromise = page.evaluate(
    () =>
      new Promise((resolve) => {
        const root = document.documentElement;
        const obs = new MutationObserver(() => {
          if (root.classList.contains('visual-alert-flash')) {
            obs.disconnect();
            resolve(true);
          }
        });
        obs.observe(root, { attributes: true, attributeFilter: ['class'] });
        setTimeout(() => {
          obs.disconnect();
          resolve(false);
        }, 4000);
      }),
  );

  const readBtn = page.getByRole('button', { name: /read page aloud/i });
  if (await readBtn.isVisible().catch(() => false)) {
    await readBtn.click();
  } else {
    await page.evaluate(() => {
      const toaster = document.createElement('ol');
      toaster.setAttribute('data-sonner-toaster', '');
      document.body.appendChild(toaster);
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      const li = document.createElement('li');
      li.setAttribute('data-sonner-toast', '');
      li.textContent = 'deaf-a11y-flash-test';
      toaster?.appendChild(li);
    });
  }

  const flashed = await flashPromise;
  ok('Visual alert flash on toast', flashed);
  await page.keyboard.press('Escape');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const afterReload = await page.evaluate(() => ({
    captions: localStorage.getItem('prefer-captions'),
    visual: localStorage.getItem('visual-alerts'),
    haptic: localStorage.getItem('haptic-feedback'),
    classCaptions: document.documentElement.classList.contains('prefer-captions'),
    classVisual: document.documentElement.classList.contains('visual-alerts-on'),
  }));
  ok(
    'Prefs survive reload',
    afterReload.captions === 'true' &&
      afterReload.visual === 'true' &&
      afterReload.haptic === 'true' &&
      afterReload.classCaptions &&
      afterReload.classVisual,
    JSON.stringify(afterReload),
  );

  await page.goto('http://localhost:8080/podcasts', { waitUntil: 'networkidle', timeout: 30000 });
  ok('Podcasts page loads with prefs', page.url().includes('/podcasts'));

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const feedClass = await page.evaluate(() =>
    document.documentElement.classList.contains('prefer-captions'),
  );
  ok('Feed keeps prefer-captions class', feedClass);
} catch (err) {
  ok('Unexpected error', false, String(err?.stack || err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\nSummary: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
