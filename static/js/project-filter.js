const projectGrid = document.querySelector(".projects-grid");

if (projectGrid) {
    const projects = Array.from(
        projectGrid.querySelectorAll(".project-showcase-card")
    );
    const searchInput = document.querySelector("#project-search");
    const sortSelect = document.querySelector("#project-sort");
    const emptyState = document.querySelector("#project-filter-empty");

    const updateProjects = () => {
        const query = searchInput.value.trim().toLowerCase();
        const direction = sortSelect.value === "oldest" ? 1 : -1;
        let visibleProjects = 0;

        projects
            .sort((first, second) => {
                return first.dataset.projectCreated.localeCompare(
                    second.dataset.projectCreated
                ) * direction;
            })
            .forEach((project) => {
                const searchableText = `${project.dataset.projectTitle} ${project.dataset.projectDescription}`;
                const matchesSearch = !query || searchableText.includes(query);
                const isVisible = matchesSearch;

                project.hidden = !isVisible;
                projectGrid.appendChild(project);
                if (isVisible) visibleProjects += 1;
            });

        if (emptyState) {
            emptyState.hidden = visibleProjects !== 0;
            projectGrid.appendChild(emptyState);
        }
    };

    searchInput.addEventListener("input", updateProjects);
    sortSelect.addEventListener("change", updateProjects);
    updateProjects();
}
