import fsp from "fs/promises";
import {
  header,
  footer,
  templateArticle,
  templateArticleDetail,
} from "../templates.js";

// TODO: compress all images

const getArticles = async () => {
  const articles = await fsp.readFile("data/articles.json", "utf-8");
  return JSON.parse(articles);
};

const getArticleList = async () => {
  const articles = await getArticles();
  return `<ul class="article-list">${articles
    .sort(
      (a, b) =>
        new Date(b.published).getMilliseconds() -
        new Date(a.published).getMilliseconds()
    )
    .map((article, index) => templateArticle({ ...article, index }))
    .join("")}</ul>`;
};

const getArticleDetail = async (id) => {
  const articles = await getArticles();
  const article = articles.find((article) => article.id === id);
  return templateArticleDetail(article);
};

const buildPage = async (path, content) => {
  const html = header + content + footer;
  await fsp.writeFile(`_dist/${path}`, html);
};

(async () => {
  console.log("Building site...");

  await fsp.rm("_dist", { recursive: true, force: true });
  await fsp.mkdir("_dist/articles", { recursive: true });

  const articles = await getArticles();
  const articleList = await getArticleList();

  await buildPage("articles/index.html", articleList);

  await Promise.all(
    articles.map(async ({ id }) => {
      const articleDetail = await getArticleDetail(id);
      await buildPage(`/articles/${id}.html`, articleDetail);
    })
  );

  await fsp.cp(`src/public`, `_dist`, {
    recursive: true,
  });

  console.log("Site built!");
})();
