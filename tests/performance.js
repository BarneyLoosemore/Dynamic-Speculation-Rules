import puppeteer from "puppeteer";
import fsp from "fs/promises";

const TEST_RUNS = 500;
const MAX_CONCURRENT_TESTS = 10;

const mostPopularLinks = [3, 6, 8];
const articleLinks = Array.from({ length: TEST_RUNS }, () => {
  const fiftyFifty = Math.random() < 0.5;
  if (fiftyFifty) {
    return mostPopularLinks[
      Math.floor(Math.random() * mostPopularLinks.length)
    ];
  }
  return Math.floor(Math.random() * 10) + 1;
});

const chunkArray = (array, size) =>
  array.reduce((accumulator, _, index) => {
    if (index % size === 0)
      return [...accumulator, array.slice(index, index + size)];
    return accumulator;
  }, []);

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

const runTest = async ({ linkNumber, speculationRulesEnabled }) => {
  const browser = await puppeteer.launch();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const client = await page.createCDPSession();
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: 9000,
    uploadThroughput: 6750,
    latency: 150,
  });

  if (!speculationRulesEnabled) {
    await page.setExtraHTTPHeaders({
      "X-Disable-Speculation-Rules": "true",
    });
  }

  await page
    .goto("http://localhost:8787", {
      timeout: 10000,
      waitUntil: "networkidle0",
    })
    .catch(() => {});

  const link = await page.$(`.article-card:nth-of-type(${linkNumber}) a`);
  const linkUrl = await page.evaluate((el) => el.href, link);
  await link.click();

  await page
    .waitForNavigation({
      timeout: 5000,
      waitUntil: "networkidle0",
    })
    .catch(() => {});

  await page.evaluate(reportLCP);
  await page.waitForFunction(() => window.lcpRecorded);
  const lcp = await page.evaluate(() => window.largestContentfulPaint);

  console.log(`Link /${linkUrl}: Largest Contentful Paint: ${lcp}ms`);

  await browser.close().catch(console.error);

  return lcp;
};

const calculatePercentile = (data, percentile) => {
  const sortedData = data.filter(Boolean).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sortedData.length);
  return sortedData[index];
};

const calcMean = (data) => {
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length;
};

const runTests = async ({ speculationRulesEnabled }) => {
  const lcpResults = [];

  const testChunks = chunkArray(articleLinks, MAX_CONCURRENT_TESTS);
  for (const chunk of testChunks) {
    const chunkTests = chunk.map((linkNumber) =>
      runTest({ linkNumber, speculationRulesEnabled }).catch((error) =>
        console.error(`Link number ${linkNumber} failed`, error)
      )
    );
    const chunkResults = (await Promise.all(chunkTests)).filter(Boolean);
    lcpResults.push(...chunkResults);
  }

  console.log(lcpResults);
  console.log(`75th percentile: ${calculatePercentile(lcpResults, 75)}ms`);
  console.log(`95th percentile: ${calculatePercentile(lcpResults, 95)}ms`);
  console.log(`Mean: ${calcMean(lcpResults)}ms`);
  await fsp.writeFile(
    `tests/lcp-results-${
      speculationRulesEnabled ? "speculation-rules" : "no-speculation-rules"
    }.json`,
    JSON.stringify(lcpResults)
  );
};

(async () => {
  await runTests({ speculationRulesEnabled: true });
  await runTests({ speculationRulesEnabled: false });
})();
