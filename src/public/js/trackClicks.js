const links = document.querySelectorAll("a");

for (const link of links) {
  link.addEventListener("click", async (event) => {
    navigator.sendBeacon(
      "/increment-article-click",
      new URL(event.currentTarget.href).pathname
    );
  });
}
