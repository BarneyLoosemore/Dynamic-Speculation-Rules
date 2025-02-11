const addRandomDelay = () => {
  const MIN = 200;
  const MAX = 500;
  const delay = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const incrementArticleClick = async (
  request: Request,
  store: Env["SPECULATION_RULES"]
) => {
  const url = await request.text();
  const articleClicks = JSON.parse((await store.get("articleClicks")) ?? "{}");
  const incrementedArticleClicks = JSON.stringify({
    ...articleClicks,
    [url]: (articleClicks[url] ?? 0) + 1,
  });
  await store.put("articleClicks", incrementedArticleClicks);
  return new Response("OK", { status: 200 });
};

const createSpeculationRules = async (store: Env["SPECULATION_RULES"]) => {
  const articleClicks = JSON.parse(
    (await store.get("articleClicks")) ?? "{}"
  ) as Record<string, number>;

  const mostClickedArticleUrls = Object.entries(articleClicks)
    .sort(([, aClicks], [, bClicks]) => bClicks - aClicks)
    .slice(0, 3)
    .map(([url]) => url);

  return `<script type='speculationrules'>{"prerender": [{ "urls": ${JSON.stringify(
    mostClickedArticleUrls
  )}, "eagerness": "immediate", "referrer_policy": "no-referrer" }]}</script>`;
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const store = env.SPECULATION_RULES;

    if (
      url.pathname === "/increment-article-click" &&
      request.method === "POST"
    ) {
      return incrementArticleClick(request, store);
    }

    const isDocumentRequest = request.headers
      .get("Accept")
      ?.includes("text/html");

    if (isDocumentRequest) {
      await addRandomDelay();
      const response = await env.ASSETS.fetch(request);

      return new HTMLRewriter()
        .on("head", {
          async element(element) {
            const speculationRules = await createSpeculationRules(store);
            element.append(speculationRules, { html: true });
          },
        })
        .transform(response);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
