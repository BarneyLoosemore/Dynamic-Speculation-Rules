export const header = `
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/styles/index.css" />
    <link rel="preload" href="/fonts/inconsolata.woff2" as="font" type="font/woff2" crossorigin="anonymous">
    <title>News Site</title>
  </head>
  <body>
    <header>
      <a href="/">
        <h1>News Site</h1>
      </a>
    </header>
    <main>
  `;

export const footer = `
    </main>
    <footer>
      <p>I am a footer</p>
    </footer>
  </body>
  </html>
  `;

export const templateArticle = ({
  index,
  id,
  title,
  published,
  category,
  image,
}) => {
  const ONE_HOUR_MS = 3600000;
  const MAX_LCP_ARTICLES = 6;
  const hoursSincePublished = Math.floor(
    (Date.now() - new Date(published).getTime()) / ONE_HOUR_MS
  );
  const cardClass =
    {
      Food: "large",
      Fashion: "medium",
    }[category] ?? "small";

  const isLCP = index <= MAX_LCP_ARTICLES;

  return `
    <li class="article-card article-card--${cardClass}">
      <article id="${id}">
        <a href="/${id}">
          <img src="${image}" alt="" loading=${isLCP ? "eager" : "lazy"} />
          <h2>${title}</h2>
          <span>${category}</span>
          <span class="published">${hoursSincePublished}H AGO</span>
        </a>
      </article>
    </li>
  `;
};

export const templateArticleDetail = ({
  title,
  category,
  image,
  author,
  published,
  content,
}) => {
  const publishedDate = new Date(published).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `
  <section class="article-detail">
    <h2>${title}</h2>
    <img src="${image}" />
    <span class="author">${author}</span>
    <time class="published">${publishedDate}</time>
    <span class="category">${category}</span>
    <p>${content}</p>
  </section>
`;
};

const calcMean = (data) => {
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length;
};

const calculatePercentile = (data, percentile) => {
  const sortedData = data.filter(Boolean).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sortedData.length);
  return sortedData[index];
};

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

export const templateResults = (results) => {
  const { speculationLcpResults, noSpeculationLcpResults } = results;

  const zippedResults = zip(speculationLcpResults, noSpeculationLcpResults);

  const calculatedResults = ["mean", 50, 75, 90, 95].map((percentile) => {
    const calcFn = percentile === "mean" ? calcMean : calculatePercentile;
    const speculation = calcFn(speculationLcpResults, percentile);
    const noSpeculation = calcFn(noSpeculationLcpResults, percentile);
    return [percentile, speculation, noSpeculation];
  });

  const tableRows = calculatedResults.map(
    ([percentile, speculation, noSpeculation]) => `
    <tr>
      <td>${
        percentile === "mean"
          ? "Mean"
          : percentile === 50
          ? "Median"
          : `${percentile}th Percentile`
      }</td>
      <td>${speculation}ms</td>
      <td>${noSpeculation}ms</td>
    </tr>
  `
  );

  return `
  <table>
    <caption>LCP Results</caption>
    <thead>
      <tr>
        <th></th>
        <th>Speculation</th>
        <th>No Speculation</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows.join("")}
    <tbody>
  </table>
  `;
};
