/**
 * index.js — filter and sort for the project archive.
 * Loaded from layouts/projects/list.html. Runs only when .work is present.
 * Reads data-search, data-tags, and data-date on each card.
 * Also pins the flow-field to the left edge of the viewport.
 */

const root = document.querySelector(".work");
if (root) {
  const flow = root.querySelector(".work__flow");
  const mark = root.querySelector(".work__mark");
  const pinFlow = () => {
    if (!flow || !mark) return;
    flow.style.left = `${-mark.getBoundingClientRect().left}px`;
  };
  pinFlow();
  window.addEventListener("resize", pinFlow);

  const search = root.querySelector("[data-work-search]");
  const sort = root.querySelector("[data-work-sort]");
  const grid = root.querySelector("[data-work-grid]");
  const empty = root.querySelector("[data-work-empty]");
  const active = new Set();

  const cards = () => [...grid.querySelectorAll("[data-work-card]")];

  const apply = () => {
    const query = (search.value || "").trim().toLowerCase();
    let shown = 0;

    cards().forEach((card) => {
      const haystack = card.dataset.search || "";
      const cardTags = (card.dataset.tags || "").split(",").filter(Boolean);
      const matchesQuery = !query || haystack.includes(query);
      const matchesTags = active.size === 0 || cardTags.some((tag) => active.has(tag));
      const visible = matchesQuery && matchesTags;
      card.hidden = !visible;
      if (visible) shown += 1;
    });

    if (empty) empty.hidden = shown !== 0;
  };

  const reorder = () => {
    const mode = sort.value;
    const list = cards();
    list.sort((a, b) => {
      const dateA = Number(a.dataset.date);
      const dateB = Number(b.dataset.date);
      const titleA = a.dataset.title || "";
      const titleB = b.dataset.title || "";
      switch (mode) {
        case "date-asc":
          return dateA - dateB;
        case "name-asc":
          return titleA.localeCompare(titleB);
        case "name-desc":
          return titleB.localeCompare(titleA);
        default:
          return dateB - dateA;
      }
    });
    list.forEach((card) => grid.appendChild(card));
  };

  search.addEventListener("input", apply);
  sort.addEventListener("change", () => {
    reorder();
    apply();
  });

  root.querySelectorAll("[data-work-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;
      const on = active.has(tag);
      if (on) active.delete(tag);
      else active.add(tag);
      button.classList.toggle("is-active", !on);
      button.setAttribute("aria-pressed", String(!on));
      apply();
    });
  });
}
