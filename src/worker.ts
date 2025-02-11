const addRandomDelay = () => {
  const MIN = 200;
  const MAX = 500;
  const delay = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const incrementArticleClick = async (
  url: string,
  store: Env["SPECULATION_RULES"]
) => {
  const articleClicks = JSON.parse((await store.get("articleClicks")) ?? "{}");
  const incrementedArticleClicks = JSON.stringify({
    ...articleClicks,
    [url]: (articleClicks[url] ?? 0) + 1,
  });
  await store.put("articleClicks", incrementedArticleClicks);
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
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const store = env.SPECULATION_RULES;

    if (
      url.pathname === "/increment-article-click" &&
      request.method === "POST"
    ) {
      const { url } = await request.json<{ url: string }>();
      await incrementArticleClick(url, store);
      return new Response("Incremented link click", { status: 200 });
    }

    if (request.headers.get("Accept")?.includes("text/html")) {
      const referer = request.headers.get("Referer");
      const refererUrl = referer ? new URL(referer) : null;
      const store = env.SPECULATION_RULES;
      const shouldTrackArticleClick =
        refererUrl?.pathname === "/articles/" &&
        refererUrl?.pathname !== url.pathname;

      if (shouldTrackArticleClick)
        ctx.waitUntil(incrementArticleClick(url.pathname, store));

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
