const articleLinks = document.querySelectorAll(".article-card a");

for (const link of articleLinks) {
  link.addEventListener("click", async (event) => {
    navigator.sendBeacon(
      "/increment-article-click",
      new URL(event.currentTarget.href).pathname
    );
  });
}
