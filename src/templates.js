export const header = `
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/styles/index.css" />
    <link rel="preload" href="/fonts/inconsolata.woff2" as="font" type="font/woff2" crossorigin />
    <title>News Site</title>
  </head>
  <body>
    <header>
      <h1>News Site</h1>
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
