"use strict";

const experienceTimeline = document.getElementById("experience-timeline");

if (experienceTimeline) {
    const searchInput = document.getElementById("experience-search");
    const sortSelect = document.getElementById("experience-sort");
    const categoryButtons = Array.from(
        document.querySelectorAll("[data-category-filter]")
    );
    const loadingState = document.getElementById("experience-loading");
    const errorState = document.getElementById("experience-error");
    const emptyState = document.getElementById("experience-empty");
    const experienceForm = document.getElementById("experience-form");
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const isAuthenticated = experienceTimeline.dataset.isAuthenticated === "true";
    const canEdit = experienceTimeline.dataset.canEdit === "true";
    const isSuperuser = experienceTimeline.dataset.isSuperuser === "true";
    const debounceDelay = 300;
    let selectedCategory = "";
    let debounceTimer;
    let requestController;

    const createElement = (tagName, className = "", text) => {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const createSvg = (paths) => {
        const namespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(namespace, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        paths.forEach((pathData) => {
            const path = document.createElementNS(namespace, "path");
            path.setAttribute("d", pathData);
            svg.appendChild(path);
        });
        return svg;
    };

    const buildUrl = (template, experienceId) => {
        return template.replace(placeholderId, experienceId);
    };

    const createCsrfInput = () => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "csrfmiddlewaretoken";
        input.value = experienceTimeline.dataset.csrfToken;
        return input;
    };

    const getCookie = (name) => {
        const cookie = document.cookie
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
    };

    const formatMonthYear = (dateValue) => {
        if (!dateValue) return "Date unavailable";
        const [year, month] = dateValue.split("-").map(Number);
        return new Intl.DateTimeFormat("en", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(Date.UTC(year, month - 1, 1)));
    };

    const displayPageSection = (activeSection) => {
        const sections = {
            loading: loadingState,
            error: errorState,
            empty: emptyState,
            timeline: experienceTimeline,
        };
        Object.entries(sections).forEach(([name, element]) => {
            element.classList.toggle("hide", name !== activeSection);
        });
    };

    const createStarControl = (experience, experienceId) => {
        const form = createElement("form", "experience-star-form");
        form.method = "post";
        form.action = buildUrl(experienceTimeline.dataset.starUrl, experienceId);

        if (isAuthenticated) {
            form.appendChild(createCsrfInput());
        } else {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const next = encodeURIComponent(window.location.pathname);
                window.location.href = `${experienceTimeline.dataset.loginUrl}?next=${next}`;
            });
        }

        const button = createElement(
            "button",
            `experience-action experience-action--star${
                experience.is_starred ? " is-starred" : ""
            }`
        );
        button.type = "submit";
        button.title = experience.star_count
            ? `Starred by ${experience.starred_by_names.join(", ")}`
            : "Be the first to star this experience";
        const icon = createElement("span", "", "★");
        icon.setAttribute("aria-hidden", "true");
        button.append(
            icon,
            document.createTextNode(experience.is_starred ? " Unstar " : " Star "),
            createElement("span", "experience-star-count", experience.star_count)
        );
        form.appendChild(button);
        return form;
    };

    const createEditControl = (experience, experienceId) => {
        const link = createElement(
            "a",
            "experience-action experience-action--edit"
        );
        link.href = buildUrl(experienceTimeline.dataset.editUrl, experienceId);
        link.setAttribute("aria-label", `Edit ${experience.title}`);
        link.append(
            createSvg([
                "M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z",
                "m13.5 6.5 4 4",
            ]),
            createElement("span", "", "Edit Experience")
        );
        return link;
    };

    const createDeleteControl = (experience, experienceId) => {
        const form = createElement("form");
        form.method = "post";
        form.action = buildUrl(experienceTimeline.dataset.deleteUrl, experienceId);
        form.appendChild(createCsrfInput());
        form.addEventListener("submit", (event) => {
            if (!window.confirm(`Delete ${experience.title}?`)) event.preventDefault();
        });

        const button = createElement(
            "button",
            "experience-action experience-action--delete"
        );
        button.type = "submit";
        button.setAttribute("aria-label", `Delete ${experience.title}`);
        button.append(
            createSvg([
                "M4 7h16",
                "M9 7V4h6v3",
                "m6 7 1 13h10l1-13",
                "M10 11v5M14 11v5",
            ]),
            createElement("span", "", "Delete Experience")
        );
        form.appendChild(button);
        return form;
    };

    const buildExperienceElement = (item) => {
        const experience = item.fields;
        const details = createElement("details", "timeline-item");
        const summary = createElement("summary", "timeline-summary");
        const badges = createElement("div", "timeline-badges");
        badges.append(
            createElement("span", "timeline-category", experience.category_display),
            createElement(
                "span",
                `timeline-status${experience.is_ongoing ? " is-current" : ""}`,
                experience.is_ongoing ? "Current" : "Completed"
            )
        );

        const periodEnd = experience.is_ongoing
            ? "Present"
            : formatMonthYear(experience.end_date);
        summary.append(
            badges,
            createElement("span", "timeline-title", experience.title),
            createElement(
                "span",
                "timeline-period",
                `${formatMonthYear(experience.start_date)} – ${periodEnd}`
            )
        );

        const content = createElement("div", "timeline-content");
        const contentBody = createElement("div", "timeline-content-body");
        contentBody.appendChild(
            createElement("div", "timeline-description", experience.description)
        );

        const actions = createElement("div", "timeline-actions");
        actions.appendChild(createStarControl(experience, item.pk));
        if (canEdit) actions.appendChild(createEditControl(experience, item.pk));
        if (isSuperuser) {
            actions.appendChild(createDeleteControl(experience, item.pk));
        }
        contentBody.appendChild(actions);
        content.appendChild(contentBody);
        details.append(summary, content);
        return details;
    };

    const fetchExperiences = async () => {
        if (requestController) requestController.abort();
        requestController = new AbortController();
        displayPageSection("loading");

        const url = new URL(
            experienceTimeline.dataset.experiencesEndpoint,
            window.location.origin
        );
        const searchQuery = searchInput.value.trim();
        if (searchQuery) url.searchParams.set("q", searchQuery);
        if (selectedCategory) url.searchParams.set("category", selectedCategory);
        url.searchParams.set("sort", sortSelect.value);

        try {
            const response = await fetch(url, {
                headers: { Accept: "application/json" },
                signal: requestController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const experiences = await response.json();
            experienceTimeline.replaceChildren();
            if (!experiences.length) {
                displayPageSection("empty");
                return;
            }

            experiences.forEach((experience) => {
                experienceTimeline.appendChild(buildExperienceElement(experience));
            });
            displayPageSection("timeline");
        } catch (error) {
            if (error.name === "AbortError") return;
            console.error("Unable to load experiences:", error);
            displayPageSection("error");
        }
    };

    const getFormErrorMessage = (result, status) => {
        if (!result.errors) {
            return result.message || `Something went wrong (status ${status}).`;
        }

        return Object.values(result.errors)
            .flat()
            .map((error) => error.message)
            .join(" ");
    };

    const incrementCategoryCounts = (category) => {
        categoryButtons.forEach((button) => {
            if (button.dataset.categoryFilter && button.dataset.categoryFilter !== category) {
                return;
            }

            const count = button.querySelector("span");
            if (count) count.textContent = String(Number(count.textContent) + 1);
        });
    };

    const addExperience = async (event) => {
        event.preventDefault();

        const submitButton = experienceForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const response = await fetch(experienceForm.dataset.ajaxUrl, {
                method: "POST",
                headers: {
                    "X-CSRFToken":
                        getCookie("csrftoken") || experienceTimeline.dataset.csrfToken,
                },
                body: new FormData(experienceForm),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(
                    "Unable to add experience",
                    getFormErrorMessage(result, response.status),
                    "error"
                );
                return;
            }

            incrementCategoryCounts(result.category);
            experienceForm.reset();
            window.closeExperienceModal();
            showToast("Experience added", result.message, "success");
            await fetchExperiences();
        } catch (error) {
            console.error("Unable to add experience:", error);
            showToast(
                "Unable to add experience",
                "Could not connect to the server. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
        }
    };

    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchExperiences, debounceDelay);
    });

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.categoryFilter;
            categoryButtons.forEach((item) => {
                item.classList.toggle("is-active", item === button);
            });
            fetchExperiences();
        });
    });

    sortSelect.addEventListener("change", fetchExperiences);

    window.closeExperienceModal = () => {
        const modal = document.getElementById("add-experience-modal");
        if (modal?.matches(":popover-open")) modal.hidePopover();
    };

    if (experienceForm) {
        experienceForm.addEventListener("submit", addExperience);
    }

    fetchExperiences();
}
