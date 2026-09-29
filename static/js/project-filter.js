"use strict";

const projectGrid = document.getElementById("projects-grid");

if (projectGrid) {
    const searchForm = document.getElementById("project-search-form");
    const searchInput = document.getElementById("project-search");
    const sortSelect = document.getElementById("project-sort");
    const loadingState = document.getElementById("project-loading");
    const errorState = document.getElementById("project-error");
    const emptyState = document.getElementById("project-empty");
    const projectForm = document.getElementById("project-form");
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const isSuperuser = projectGrid.dataset.isSuperuser === "true";
    const searchDebounceDelay = 300;
    let projectsAbortController;
    let searchDebounceTimer;

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

    const buildUrl = (template, projectId) => {
        return template.replace(placeholderId, projectId);
    };

    const displayPageSection = (activeSection) => {
        const sections = {
            loading: loadingState,
            error: errorState,
            empty: emptyState,
            grid: projectGrid,
        };

        Object.entries(sections).forEach(([name, element]) => {
            element.classList.toggle("hide", name !== activeSection);
        });
    };

    const createFeatureCard = (title, description, iconPaths) => {
        const card = createElement("div", "project-feature-card");
        const content = createElement("div");
        content.append(
            createElement("h3", "", title),
            createElement("p", "", description)
        );
        card.append(createSvg(iconPaths), content);
        return card;
    };

    const createCsrfInput = () => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "csrfmiddlewaretoken";
        input.value = projectGrid.dataset.csrfToken;
        return input;
    };

    const createStarForm = (project, projectId) => {
        const form = createElement("form", "star-form");
        form.method = "post";
        form.action = buildUrl(projectGrid.dataset.starUrl, projectId);

        const button = createElement(
            "button",
            `button button-star${project.is_starred ? " is-starred" : ""}`
        );
        button.type = "submit";
        button.title = project.star_count
            ? `Starred by ${project.starred_by_names.join(", ")}`
            : "Be the first to star this project";

        const icon = createElement("span", "", "★");
        icon.setAttribute("aria-hidden", "true");
        button.append(
            icon,
            document.createTextNode(project.is_starred ? " Unstar " : " Star "),
            createElement("span", "star-count", project.star_count)
        );
        form.append(createCsrfInput(), button);
        return form;
    };

    const createDeleteControl = (project, projectId) => {
        const form = createElement("form");
        form.method = "post";
        form.action = buildUrl(projectGrid.dataset.deleteUrl, projectId);
        form.addEventListener("submit", (event) => {
            if (!window.confirm(`Delete ${project.title}?`)) event.preventDefault();
        });

        const button = createElement(
            "button",
            "project-icon-action project-icon-action--delete"
        );
        button.type = "submit";
        button.title = "Delete project";
        button.setAttribute("aria-label", `Delete ${project.title}`);
        button.append(
            createSvg([
                "M4 7h16",
                "M9 7V4h6v3",
                "m6 7 1 13h10l1-13",
                "M10 11v5M14 11v5",
            ])
        );
        form.append(createCsrfInput(), button);
        return form;
    };

    const buildProjectCardElement = (item) => {
        const project = item.fields;
        const article = createElement("article", "project-showcase-card");
        article.dataset.projectCreated = project.created_at;

        const media = createElement("div", "project-showcase-media");
        if (project.project_image_url) {
            const image = createElement("img", "project-showcase-image");
            image.src = project.project_image_url;
            image.alt = `${project.title} preview`;
            media.appendChild(image);
        } else {
            const placeholder = createElement("div", "project-showcase-placeholder");
            const image = createElement("img");
            image.src = "/static/img/github.png";
            image.alt = "";
            placeholder.append(image, createElement("span", "", project.title));
            media.appendChild(placeholder);
        }

        const content = createElement("div", "project-showcase-content");
        content.appendChild(createElement("h2", "", project.title));
        if (project.subtitle) {
            content.appendChild(
                createElement("p", "project-showcase-subtitle", project.subtitle)
            );
        }
        content.appendChild(
            createElement("div", "project-showcase-description", project.description)
        );

        if (project.feature_one_title || project.feature_two_title) {
            const features = createElement("div", "project-feature-grid");
            if (project.feature_one_title) {
                features.appendChild(
                    createFeatureCard(
                        project.feature_one_title,
                        project.feature_one_description,
                        ["M12 3v4M12 17v4M3 12h4M17 12h4"]
                    )
                );
            }
            if (project.feature_two_title) {
                features.appendChild(
                    createFeatureCard(
                        project.feature_two_title,
                        project.feature_two_description,
                        ["M4 13h4l2-7 4 12 2-5h4"]
                    )
                );
            }
            content.appendChild(features);
        }

        if (project.technology_items.length) {
            const technologies = createElement("div", "project-technology-list");
            technologies.setAttribute("aria-label", "Technology stack");
            project.technology_items.forEach((technology) => {
                technologies.appendChild(createElement("span", "", technology));
            });
            content.appendChild(technologies);
        }

        const footer = createElement("div", "project-showcase-footer");
        if (project.project_url) {
            const sourceLink = createElement("a", "project-source-link", "Source Code");
            sourceLink.href = project.project_url;
            sourceLink.target = "_blank";
            sourceLink.rel = "noreferrer";
            sourceLink.prepend(createSvg(["m9 8-4 4 4 4M15 8l4 4-4 4"]));
            footer.appendChild(sourceLink);
        }

        const actions = createElement("div", "project-showcase-actions");
        actions.appendChild(createStarForm(project, item.pk));

        const editLink = createElement(
            "a",
            "project-icon-action project-icon-action--edit"
        );
        editLink.href = buildUrl(projectGrid.dataset.editUrl, item.pk);
        editLink.title = "Edit project";
        editLink.setAttribute("aria-label", `Edit ${project.title}`);
        editLink.append(
            createSvg([
                "M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z",
                "m13.5 6.5 4 4",
            ])
        );
        actions.appendChild(editLink);

        if (isSuperuser) {
            actions.appendChild(createDeleteControl(project, item.pk));
        }

        footer.appendChild(actions);
        content.appendChild(footer);
        article.append(media, content);
        return article;
    };

    const sortProjects = (projects) => {
        const direction = sortSelect.value === "oldest" ? 1 : -1;
        return projects.sort((first, second) => {
            return (
                first.fields.created_at.localeCompare(second.fields.created_at)
                * direction
            );
        });
    };

    const fetchProjects = async () => {
        if (projectsAbortController) projectsAbortController.abort();
        projectsAbortController = new AbortController();
        displayPageSection("loading");

        const url = new URL(
            projectGrid.dataset.projectsEndpoint,
            window.location.origin
        );
        const searchQuery = searchInput.value.trim();
        if (searchQuery) url.searchParams.set("title", searchQuery);

        try {
            const response = await fetch(url, {
                headers: { Accept: "application/json" },
                signal: projectsAbortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const projects = sortProjects(await response.json());
            projectGrid.replaceChildren();

            if (!projects.length) {
                displayPageSection("empty");
                return;
            }

            projects.forEach((project) => {
                projectGrid.appendChild(buildProjectCardElement(project));
            });
            displayPageSection("grid");
        } catch (error) {
            if (error.name === "AbortError") return;
            console.error("Unable to load projects:", error);
            displayPageSection("error");
        }
    };

    const searchProjects = () => {
        fetchProjects();
    };

    const getCookie = (name) => {
        const cookie = document.cookie
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
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

    const addProject = async (event) => {
        event.preventDefault();

        const submitButton = projectForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const response = await fetch(projectForm.dataset.ajaxUrl, {
                method: "POST",
                headers: { "X-CSRFToken": getCookie("csrftoken") },
                body: new FormData(projectForm),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(
                    "Unable to add project",
                    getFormErrorMessage(result, response.status),
                    "error"
                );
                return;
            }

            projectForm.reset();
            window.closeProjectModal();
            showToast("Project added", result.message, "success");
            await fetchProjects();
        } catch (error) {
            console.error("Unable to add project:", error);
            showToast(
                "Unable to add project",
                "Could not connect to the server. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
        }
    };

    searchInput.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(searchProjects, searchDebounceDelay);
    });

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        clearTimeout(searchDebounceTimer);
        searchProjects();
    });
    sortSelect.addEventListener("change", fetchProjects);

    window.closeProjectModal = () => {
        const modal = document.getElementById("add-project-modal");
        if (modal?.matches(":popover-open")) modal.hidePopover();
    };

    if (projectForm) projectForm.addEventListener("submit", addProject);

    fetchProjects();
}
