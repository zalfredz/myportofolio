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
    const isAuthenticated = projectGrid.dataset.isAuthenticated === "true";
    const isSuperuser = projectGrid.dataset.isSuperuser === "true";
    const searchDebounceDelay = 300;
    const projectFields = [
        "title",
        "subtitle",
        "description",
        "feature_one_title",
        "feature_one_description",
        "feature_two_title",
        "feature_two_description",
        "technology_stack",
        "project_url",
        "project_image_url",
    ];
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

    const createStarControl = (project) => {
        const control = createElement(
            isAuthenticated ? "button" : "a",
            `button button-star${project.is_starred ? " is-starred" : ""}`
        );
        control.title = project.star_count
            ? `Starred by ${project.starred_by_names}`
            : "Be the first to star this project";

        if (isAuthenticated) {
            control.type = "button";
            control.dataset.action = "star";
            control.dataset.id = project.id;
        } else {
            const next = encodeURIComponent(window.location.pathname);
            control.href = `${projectGrid.dataset.loginUrl}?next=${next}`;
        }

        const icon = createElement("span", "", "★");
        icon.setAttribute("aria-hidden", "true");
        control.append(
            icon,
            document.createTextNode(project.is_starred ? " Unstar " : " Star "),
            createElement("span", "star-count", project.star_count)
        );
        return control;
    };

    const createDeleteControl = (project) => {
        const button = createElement(
            "button",
            "project-icon-action project-icon-action--delete"
        );
        button.type = "button";
        button.dataset.action = "delete";
        button.dataset.id = project.id;
        button.dataset.title = project.title;
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
        return button;
    };

    const buildProjectCardElement = (project) => {
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
        actions.appendChild(createStarControl(project));

        const editLink = createElement(
            "a",
            "project-icon-action project-icon-action--edit"
        );
        editLink.href = buildUrl(projectGrid.dataset.editUrl, project.id);
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
            actions.appendChild(createDeleteControl(project));
        }

        footer.appendChild(actions);
        content.appendChild(footer);
        article.append(media, content);
        return article;
    };

    const sortProjects = (projects) => {
        const direction = sortSelect.value === "oldest" ? 1 : -1;
        return projects.sort((first, second) => {
            return first.created_at.localeCompare(second.created_at) * direction;
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
            projectGrid.replaceChildren(...projects.map(buildProjectCardElement));
            displayPageSection(projects.length ? "grid" : "empty");
        } catch (error) {
            if (error.name === "AbortError") return;
            console.error("Unable to load projects:", error);
            displayPageSection("error");
        }
    };

    const getCookie = (name) => {
        const cookie = document.cookie
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
    };

    const apiErrorMessage = (data, status) => {
        const messages = Object.values(data)
            .flat()
            .filter((value) => typeof value === "string");
        return messages.join(" ") || `Request failed (HTTP ${status}).`;
    };

    const writeProject = async (url, method, payload) => {
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

    const addProject = async (event) => {
        event.preventDefault();

        const submitButton = projectForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const fields = new FormData(projectForm);
            const payload = Object.fromEntries(
                projectFields.map((name) => [name, fields.get(name) ?? ""])
            );
            await writeProject(projectGrid.dataset.projectsEndpoint, "POST", payload);

            projectForm.reset();
            window.closeProjectModal();
            showToast("Project added", "Project added successfully.", "success");
            await fetchProjects();
        } catch (error) {
            console.error("Unable to add project:", error);
            showToast("Unable to add project", error.message, "error");
        } finally {
            submitButton.disabled = false;
        }
    };

    projectGrid.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button || button.disabled) return;

        const action = button.dataset.action;
        if (action === "delete" && !window.confirm(`Delete ${button.dataset.title}?`)) {
            return;
        }

        button.disabled = true;
        try {
            if (action === "star") {
                await writeProject(
                    buildUrl(projectGrid.dataset.starUrl, button.dataset.id),
                    "POST"
                );
            } else {
                await writeProject(
                    buildUrl(projectGrid.dataset.detailUrl, button.dataset.id),
                    "DELETE"
                );
                showToast("Project deleted", "Project deleted successfully.", "success");
            }
            await fetchProjects();
        } catch (error) {
            console.error(`Unable to ${action} project:`, error);
            showToast("Request failed", error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    searchInput.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(fetchProjects, searchDebounceDelay);
    });

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        clearTimeout(searchDebounceTimer);
        fetchProjects();
    });
    sortSelect.addEventListener("change", fetchProjects);

    window.closeProjectModal = () => {
        const modal = document.getElementById("add-project-modal");
        if (modal?.matches(":popover-open")) modal.hidePopover();
    };

    if (projectForm) projectForm.addEventListener("submit", addProject);

    fetchProjects();
}
