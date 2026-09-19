const experienceTimeline = document.querySelector(".experience-timeline");

if (experienceTimeline) {
    const items = Array.from(
        experienceTimeline.querySelectorAll(".timeline-item")
    );
    const categoryButtons = Array.from(
        document.querySelectorAll("[data-category-filter]")
    );
    const sortSelect = document.querySelector("#experience-sort");
    const emptyState = document.querySelector("#experience-filter-empty");
    let selectedCategory = "";

    const applyFilters = () => {
        const sortOrder = sortSelect.value;
        let visibleItems = 0;

        items
            .sort((first, second) => {
                const comparison = first.dataset.start.localeCompare(
                    second.dataset.start
                );
                return sortOrder === "oldest" ? comparison : -comparison;
            })
            .forEach((item) => {
                const isVisible =
                    !selectedCategory || item.dataset.category === selectedCategory;

                item.hidden = !isVisible;
                if (isVisible) visibleItems += 1;
                experienceTimeline.appendChild(item);
            });

        if (emptyState) {
            emptyState.hidden = visibleItems !== 0;
            experienceTimeline.appendChild(emptyState);
        }
    };

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.categoryFilter;
            categoryButtons.forEach((item) => {
                item.classList.toggle("is-active", item === button);
            });
            applyFilters();
        });
    });

    sortSelect.addEventListener("change", applyFilters);
}
