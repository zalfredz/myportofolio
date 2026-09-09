document.querySelectorAll(".timeline-item").forEach((item) => {
    const summary = item.querySelector(".timeline-summary");

    summary.addEventListener("click", (event) => {
        if (item.classList.contains("is-closing")) {
            event.preventDefault();
            return;
        }

        if (!item.open) {
            return;
        }

        event.preventDefault();
        item.classList.add("is-closing");

        window.setTimeout(() => {
            item.open = false;
            item.classList.remove("is-closing");
        }, 250);
    });
});
