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
    const editModal = document.getElementById("edit-experience-modal");
    const editForm = document.getElementById("edit-experience-form");
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const isAuthenticated = experienceTimeline.dataset.isAuthenticated === "true";
    const canEdit = experienceTimeline.dataset.canEdit === "true";
    const isSuperuser = experienceTimeline.dataset.isSuperuser === "true";
    const debounceDelay = 300;
    const nullableFields = new Set(["thumbnail", "start_date", "end_date"]);
    const experienceFields = [
        "title",
        "description",
        "category",
        "thumbnail",
        "start_date",
        "end_date",
    ];
    const loadedExperiences = new Map();
    let selectedCategory = "";
    let debounceTimer;
    let requestController;
    let editingExperience;

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

    const createStarControl = (experience) => {
        const control = createElement(
            isAuthenticated ? "button" : "a",
            `experience-action experience-action--star${
                experience.is_starred ? " is-starred" : ""
            }`
        );
        control.title = experience.star_count
            ? `Starred by ${experience.starred_by_names}`
            : "Be the first to star this experience";

        if (isAuthenticated) {
            control.type = "button";
            control.dataset.action = "star";
            control.dataset.id = experience.id;
        } else {
            const next = encodeURIComponent(window.location.pathname);
            control.href = `${experienceTimeline.dataset.loginUrl}?next=${next}`;
        }

        const icon = createElement("span", "", "★");
        icon.setAttribute("aria-hidden", "true");
        control.append(
            icon,
            document.createTextNode(experience.is_starred ? " Unstar " : " Star "),
            createElement("span", "experience-star-count", experience.star_count)
        );
        return control;
    };

    const createEditControl = (experience) => {
        const button = createElement(
            "button",
            "experience-action experience-action--edit"
        );
        button.type = "button";
        button.dataset.action = "edit";
        button.dataset.id = experience.id;
        button.setAttribute("aria-label", `Edit ${experience.title}`);
        button.append(
            createSvg([
                "M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z",
                "m13.5 6.5 4 4",
            ]),
            createElement("span", "", "Edit Experience")
        );
        return button;
    };

    const createDeleteControl = (experience) => {
        const button = createElement(
            "button",
            "experience-action experience-action--delete"
        );
        button.type = "button";
        button.dataset.action = "delete";
        button.dataset.id = experience.id;
        button.dataset.title = experience.title;
        button.dataset.category = experience.category;
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
        return button;
    };

    const buildExperienceElement = (experience) => {
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
        actions.appendChild(createStarControl(experience));
        if (canEdit) actions.appendChild(createEditControl(experience));
        if (isSuperuser) actions.appendChild(createDeleteControl(experience));
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
            loadedExperiences.clear();
            experiences.forEach((experience) => {
                loadedExperiences.set(experience.id, experience);
            });
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

    const apiErrorMessage = (data, status) => {
        const messages = Object.values(data)
            .flat()
            .filter((value) => typeof value === "string");
        return messages.join(" ") || `Request failed (HTTP ${status}).`;
    };

    const writeExperience = async (url, method, payload) => {
        const response = await fetch(url, {
            method,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
        if (response.status === 204) return null;

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(apiErrorMessage(data, response.status));
        return data;
    };

    const adjustCategoryCounts = (category, delta) => {
        categoryButtons.forEach((button) => {
            if (button.dataset.categoryFilter && button.dataset.categoryFilter !== category) {
                return;
            }

            const count = button.querySelector("span");
            if (count) count.textContent = String(Number(count.textContent) + delta);
        });
    };

    const buildPayload = (form) => {
        const fields = new FormData(form);
        return Object.fromEntries(
            experienceFields.map((name) => {
                const value = fields.get(name) ?? "";
                return [name, nullableFields.has(name) && !value ? null : value];
            })
        );
    };

    const addExperience = async (event) => {
        event.preventDefault();

        const submitButton = experienceForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const experience = await writeExperience(
                experienceTimeline.dataset.experiencesEndpoint,
                "POST",
                buildPayload(experienceForm)
            );

            adjustCategoryCounts(experience.category, 1);
            experienceForm.reset();
            window.closeExperienceModal();
            showToast("Experience added", "Experience added successfully.", "success");
            await fetchExperiences();
        } catch (error) {
            console.error("Unable to add experience:", error);
            showToast("Unable to add experience", error.message, "error");
        } finally {
            submitButton.disabled = false;
        }
    };

    const openEditModal = (experienceId) => {
        editingExperience = loadedExperiences.get(experienceId);
        if (!editingExperience) return;

        experienceFields.forEach((name) => {
            editForm.elements[name].value = editingExperience[name] ?? "";
        });
        editModal.showPopover();
    };

    const updateExperience = async (event) => {
        event.preventDefault();

        const submitButton = editForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const experience = await writeExperience(
                buildUrl(experienceTimeline.dataset.detailUrl, editingExperience.id),
                "PATCH",
                buildPayload(editForm)
            );

            if (experience.category !== editingExperience.category) {
                adjustCategoryCounts(editingExperience.category, -1);
                adjustCategoryCounts(experience.category, 1);
            }
            editModal.hidePopover();
            showToast("Experience updated", "Experience updated successfully.", "success");
            await fetchExperiences();
        } catch (error) {
            console.error("Unable to update experience:", error);
            showToast("Unable to update experience", error.message, "error");
        } finally {
            submitButton.disabled = false;
        }
    };

    experienceTimeline.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;

        const action = button.dataset.action;
        if (action === "edit") {
            openEditModal(button.dataset.id);
            return;
        }
        if (action === "delete" && !window.confirm(`Delete ${button.dataset.title}?`)) {
            return;
        }

        button.disabled = true;
        try {
            if (action === "star") {
                await writeExperience(
                    buildUrl(experienceTimeline.dataset.starUrl, button.dataset.id),
                    "POST"
                );
            } else {
                await writeExperience(
                    buildUrl(experienceTimeline.dataset.detailUrl, button.dataset.id),
                    "DELETE"
                );
                adjustCategoryCounts(button.dataset.category, -1);
                showToast("Experience deleted", "Experience deleted successfully.", "success");
            }
            await fetchExperiences();
        } catch (error) {
            console.error(`Unable to ${action} experience:`, error);
            showToast("Request failed", error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

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

    if (editForm) editForm.addEventListener("submit", updateExperience);

    fetchExperiences();
}
