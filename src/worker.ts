const addRandomDelay = () => {
  const MIN = 400;
  const MAX = 800;
  const delay = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const handleArticleClick = async (
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

  const articleUrlsSortedByClicks = Object.entries(articleClicks)
    .sort(([, aClicks], [, bClicks]) => bClicks - aClicks)
    .map(([url]) => url);

  const immediatePrerenderUrls = JSON.stringify(
    articleUrlsSortedByClicks.slice(0, 3)
  );

  return `<script type='speculationrules'>{"prerender": [{ "urls": ${immediatePrerenderUrls}, "eagerness": "immediate" }]}</script>`;
};

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const store = env.SPECULATION_RULES;

    if (pathname === "/article-click" && request.method === "POST") {
      return handleArticleClick(request, store);
    }

    const isDocumentRequest = request.headers
      .get("Accept")
      ?.includes("text/html");

    if (isDocumentRequest) {
      await addRandomDelay();
      const response = await env.ASSETS.fetch(request);

      const isSpeculationRulesDisabled = request.headers.get(
        "X-Disable-Speculation-Rules"
      );
      if (isSpeculationRulesDisabled) return response;

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
