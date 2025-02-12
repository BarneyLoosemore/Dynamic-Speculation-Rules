const articleLinks = document.querySelectorAll(".article-card a");

for (const link of articleLinks) {
  link.addEventListener("click", async (event) => {
    const { pathname } = new URL(event.currentTarget.href);
    navigator.sendBeacon("/article-click", pathname);
  });
}
