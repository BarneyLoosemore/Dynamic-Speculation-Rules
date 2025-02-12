import puppeteer from "puppeteer";

const TEST_RUNS = 100;
const MAX_CONCURRENT_TESTS = 5;

const MIN_LINK_NUMBER = 1;
const MAX_LINK_NUMBER = 10;

const mostPopularLinks = [2, 4, 9];
const linkClicks = Array.from({ length: TEST_RUNS }, () => {
  const fiftyFifty = Math.random() < 0.5;
  if (fiftyFifty) {
    return mostPopularLinks[
      Math.floor(Math.random() * mostPopularLinks.length)
    ];
  } else {
    return (
      Math.floor(Math.random() * (MAX_LINK_NUMBER - MIN_LINK_NUMBER + 1)) +
      MIN_LINK_NUMBER
    );
  }
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
  const browser = await puppeteer.launch({
    headless: false,
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  // const client = await page.createCDPSession();
  // await client.send("Network.emulateNetworkConditions", {
  //   offline: false,
  //   downloadThroughput: 15000,
  //   uploadThroughput: 6750,
  //   latency: 120,
  // });

  if (!speculationRulesEnabled) {
    await page.setExtraHTTPHeaders({
      "X-Disable-Speculation-Rules": "true",
    });
  }

  await page.goto("http://localhost:8787", {
    waitUntil: "networkidle0",
  });

  await new Promise((resolve) => setTimeout(resolve, 2500));

  const link = await page.$(`.article-card:nth-of-type(${linkNumber}) a`);

  await link.click();
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

  await page.evaluate(reportLCP);
  await page.waitForFunction(() => window.lcpRecorded);
  const lcp = await page.evaluate(() => window.largestContentfulPaint);

  console.log(`Link number ${linkNumber}: Largest Contentful Paint: ${lcp}ms`);

  await browser.close().catch(console.error);

  return lcp;
};

const timeoutTest = async (timeout, test) => {
  return Promise.race([
    test,
    new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
  ]);
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

  const testChunks = chunkArray(linkClicks, MAX_CONCURRENT_TESTS);
  for (const chunk of testChunks) {
    const chunkTests = chunk.map((linkNumber) =>
      timeoutTest(
        30000,
        runTest({ linkNumber, speculationRulesEnabled }).catch((error) =>
          console.error(`Link number ${linkNumber} failed`, error)
        )
      )
    );
    const chunkResults = await Promise.all(chunkTests);
    lcpResults.push(...chunkResults);
  }

  for (const linkNumber of linkClicks) {
    const lcp = await runTest({ linkNumber, speculationRulesEnabled });
    lcpResults.push(lcp);
  }

  console.log(lcpResults);
  console.log(`75th percentile: ${calculatePercentile(lcpResults, 75)}ms`);
  console.log(`95th percentile: ${calculatePercentile(lcpResults, 95)}ms`);
  console.log(`Mean: ${calcMean(lcpResults)}ms`);
};

(async () => {
  await runTests({ speculationRulesEnabled: true });
  await runTests({ speculationRulesEnabled: false });
})();
