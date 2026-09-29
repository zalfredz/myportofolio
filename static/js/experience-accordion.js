"use strict";

const accordionTimeline = document.getElementById("experience-timeline");

if (accordionTimeline) {
    accordionTimeline.addEventListener("click", (event) => {
        const summary = event.target.closest(".timeline-summary");
        if (!summary || !accordionTimeline.contains(summary)) return;

        const item = summary.closest(".timeline-item");
        if (item.classList.contains("is-closing")) {
            event.preventDefault();
            return;
        }

        if (!item.open) return;

        event.preventDefault();
        item.classList.add("is-closing");

        window.setTimeout(() => {
            item.open = false;
            item.classList.remove("is-closing");
        }, 250);
    });
}
