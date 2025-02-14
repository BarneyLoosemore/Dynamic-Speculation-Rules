I was reading a post on Phil Walton's blog the other day in which he outlines an interesting technique - using Cloudflare Workers to dynamically set the fetchpriority of LCP (Largest-Contentful-Paint) elements based on previous page visits.

The gist of it is fairly straightforward - on any page visit, collect both the path and attributed LCP element and persist this in Cloudflare's Worker KV store. For subseqeuent requests, retrieve the matching LCP-element for the request path in the store (if it exists), and use the streaming HTMLRewriter to add `fetchpriority="high"` to said element as part of the response.

The nice part about this pattern is how it can adapt to change - in content, structure and usage (for example, the LCP elemnt may differ per device) - meaning a developer doesn't have to hand-craft attributes ad-hoc or make any assumptions about _what_ the likely LCP element will be.

And I wondered if it could be adapted to other performance-oriented APIs?

# Speculation Rules

As a primer,
