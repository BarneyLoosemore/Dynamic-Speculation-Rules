/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    // TODO:
    // if (url.pathname === "/prerender.json") {
    //   const links = (await env.SPECULATION_RULES.get("linkClicks")) ?? {
    //     "/eaceaeeacfd": 5,
    //   };
    //   const sortedLinks = Object.entries(links).sort(([, a], [, b]) => b - a);
    //   const rules = {
    //     prerender: [
    //       {
    //         urls: sortedLinks.map(([url]) => url),
    //       },
    //     ],
    //   };
    //   const rulesJson = JSON.stringify(rules);
    //   return new Response(rulesJson, {
    //     headers: {
    //       "Content-Type": "application/speculationrules+json",
    //     },
    //   });
    // }
    if (request.headers.get("Accept")?.includes("text/html")) {
      const links = (await env.SPECULATION_RULES.get("linkClicks")) ?? {
        "/eaceaeeacfd": 5,
      };

      // HTMLRewriter
      const { body, status, statusText, headers } = await env.ASSETS.fetch(
        request
      );
      return new Response(body, {
        status,
        statusText,
        headers: {
          ...headers,
          "Speculation-Rules": "/prerender.json",
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
