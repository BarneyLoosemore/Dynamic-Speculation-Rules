import puppeteer from "puppeteer";

// const TEST_RUNS = 250;
const TEST_RUNS = 1;

const MIN_LINK_NUMBER = 1;
const MAX_LINK_NUMBER = 25;

const linkClicks = Array.from(
  { length: TEST_RUNS },
  () =>
    Math.floor(Math.random() * (MAX_LINK_NUMBER - MIN_LINK_NUMBER + 1)) +
    MIN_LINK_NUMBER
);

// function calcLCP() {
//   window.largestContentfulPaint = 0;

//   const observer = new PerformanceObserver((entryList) => {
//     const entries = entryList.getEntries();
//     const lastEntry = entries[entries.length - 1];
//     window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
//   });

//   observer.observe({ type: "largest-contentful-paint", buffered: true });

//   document.addEventListener("visibilitychange", () => {
//     if (document.visibilityState === "hidden") {
//       observer.takeRecords();
//       observer.disconnect();
//       console.log("LCP:", window.largestContentfulPaint);
//     }
//   });
// }

const reportLCP = () => {
  window.largestContentfulPaint = 0;
  const observer = new PerformanceObserver((entryList) => {
    const navigationStart =
      performance.getEntriesByType("navigation")?.[0]?.activationStart ?? 0;
    const entries = entryList.getEntries();
    const lastEntry = entries.at(-1);
    const startTime = lastEntry.startTime;
    window.largestContentfulPaint = Math.max(startTime - navigationStart, 0);
    window.lcpRecorded = true;
  });
  observer.observe({ type: "largest-contentful-paint", buffered: true });
};

const runTest = async (runNumber) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // await page.setExtraHTTPHeaders("X-Disable-Speculation-Rules");

  await page.goto("http://localhost:8787");

  await page.evaluateOnNewDocument(reportLCP);

  await Promise.all([
    page.click(`.article-card:nth-of-type(2) a`),
    page.waitForNavigation(),
  ]);

  console.log("hello");

  await page.waitForFunction("window.lcpRecorded");

  const lcp = await page.evaluate(() => window.largestContentfulPaint);

  await browser.close();

  return lcp;
};

(async () => {
  const lcpResults = await Promise.all(linkClicks.map(runTest));
  console.log(lcpResults);
})();
