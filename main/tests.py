from datetime import date

from django.contrib.auth.models import Group, User
from django.test import TestCase
from django.urls import reverse

from main.models import Experience, Project


class MainTest(TestCase):
    def setUp(self):
        self.superuser = User.objects.create(
            username="owner", is_staff=True, is_superuser=True
        )
        self.regular_user = User.objects.create(username="reader")
        self.editor = User.objects.create(username="editor")
        editor_group = Group.objects.create(name="Editor")
        self.editor.groups.add(editor_group)
        self.experience = Experience.objects.create(
            title="Asisten Dosen PBP",
            description="Membantu mahasiswa memahami pengembangan web.",
            category="part-time",
            start_date=date(2026, 1, 1),
        )
        self.project = Project.objects.create(
            title="FocusBuddy",
            description="A productivity companion.",
            technology_stack="Django, Python",
        )

    def test_main_url_is_accessible(self):
        response = self.client.get(reverse("main:show_main"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "index.html")
        self.assertNotContains(response, self.experience.title)
        self.assertContains(response, f'href="{reverse("main:show_experience")}"')

    def test_nonexistent_page_returns_404(self):
        response = self.client.get("/halaman-yang-tidak-ada/")

        self.assertEqual(response.status_code, 404)

    def test_experience_model(self):
        self.assertEqual(str(self.experience), "Asisten Dosen PBP")
        self.assertEqual(self.experience.category, "part-time")
        self.assertTrue(self.experience.is_ongoing)

    def test_experience_page(self):
        response = self.client.get(reverse("main:show_experience"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "experience.html")
        self.assertTemplateUsed(response, "base.html")
        self.assertContains(response, 'id="experience-timeline"')
        self.assertContains(response, reverse("main:get_experiences_json"))
        self.assertContains(response, 'id="experience-loading"')
        self.assertContains(response, 'id="experience-error"')
        self.assertContains(response, 'id="experience-empty"')
        self.assertNotContains(response, self.experience.title)
        self.assertNotContains(response, self.experience.description)
        self.assertNotContains(response, 'id="add-experience-modal"')
        self.assertContains(response, f'href="{reverse("main:show_main")}"')

    def test_superuser_sees_add_experience_modal(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("main:show_experience"))

        self.assertContains(response, 'popovertarget="add-experience-modal"')
        self.assertContains(response, 'id="add-experience-modal"')
        self.assertContains(response, 'id="experience-form"')
        self.assertContains(
            response,
            'data-ajax-url="{}"'.format(reverse("main:create_experience_ajax")),
        )

    def test_superuser_can_create_experience_with_ajax(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "Data Science Academy",
                "description": "Coordinated academy sessions.",
                "category": "volunteer",
                "thumbnail": "",
                "start_date": "2026-04-01",
                "end_date": "2026-09-01",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["category"], "volunteer")
        self.assertTrue(
            Experience.objects.filter(title="Data Science Academy").exists()
        )

    def test_ajax_create_experience_rejects_non_superuser(self):
        self.client.force_login(self.regular_user)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "Unauthorized Experience",
                "description": "Should not be saved.",
                "category": "volunteer",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(
            Experience.objects.filter(title="Unauthorized Experience").exists()
        )

    def test_ajax_create_experience_rejects_guest(self):
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "Guest Experience",
                "description": "Should not be saved.",
                "category": "volunteer",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Experience.objects.filter(title="Guest Experience").exists())

    def test_ajax_create_experience_rejects_editor(self):
        self.client.force_login(self.editor)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "Editor Experience",
                "description": "Should not be saved.",
                "category": "volunteer",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Experience.objects.filter(title="Editor Experience").exists())

    def test_ajax_create_experience_returns_validation_errors(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "",
                "description": "Missing title.",
                "category": "internship",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.json()["errors"])

    def test_ajax_create_experience_only_accepts_post(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("main:create_experience_ajax"))

        self.assertEqual(response.status_code, 405)

    def test_ajax_create_experience_strips_html_tags(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": "<b>Teaching Assistant</b>",
                "description": "Helped <strong>students</strong> learn calculus.",
                "category": "volunteer",
            },
        )

        self.assertEqual(response.status_code, 201)
        experience = Experience.objects.get(pk=response.json()["pk"])
        self.assertEqual(experience.title, "Teaching Assistant")
        self.assertEqual(
            experience.description,
            "Helped students learn calculus.",
        )

    def test_ajax_create_experience_rejects_html_only_title(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_experience_ajax"),
            {
                "title": '<img src="x" onerror="alert(1)">',
                "description": "Unsafe title test.",
                "category": "volunteer",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.json()["errors"])

    def test_empty_experience_page(self):
        Experience.objects.all().delete()
        response = self.client.get(reverse("main:show_experience"))

        self.assertContains(response, "No matching experience")

    def test_empty_experience_api(self):
        Experience.objects.all().delete()
        response = self.client.get(reverse("main:get_experiences_json"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_experience_search(self):
        Experience.objects.create(
            title="Unrelated Volunteer Role",
            description="Community program.",
            category="volunteer",
            start_date=date(2025, 1, 1),
        )

        response = self.client.get(
            reverse("main:get_experiences_json"),
            {"q": "Asisten Dosen"},
        )
        titles = [item["fields"]["title"] for item in response.json()]

        self.assertIn(self.experience.title, titles)
        self.assertNotIn("Unrelated Volunteer Role", titles)

    def test_experience_category_filter(self):
        volunteer = Experience.objects.create(
            title="Volunteer Role",
            description="Community program.",
            category="volunteer",
            start_date=date(2025, 1, 1),
        )

        response = self.client.get(
            reverse("main:get_experiences_json"),
            {"category": "volunteer"},
        )
        titles = [item["fields"]["title"] for item in response.json()]

        self.assertIn(volunteer.title, titles)
        self.assertNotIn(self.experience.title, titles)

    def test_experience_oldest_sort(self):
        older = Experience.objects.create(
            title="Older Role",
            description="An earlier experience.",
            category="internship",
            start_date=date(2024, 1, 1),
        )

        response = self.client.get(
            reverse("main:get_experiences_json"),
            {"sort": "oldest"},
        )
        titles = [item["fields"]["title"] for item in response.json()]

        self.assertEqual(titles[0], older.title)

    def test_completed_experience(self):
        self.experience.end_date = date(2026, 2, 1)
        self.experience.save()
        response = self.client.get(reverse("main:get_experiences_json"))

        self.assertFalse(self.experience.is_ongoing)
        self.assertEqual(response.json()[0]["fields"]["end_date"], "2026-02-01")
        self.assertFalse(response.json()[0]["fields"]["is_ongoing"])

    def test_experiences_json(self):
        response = self.client.get(reverse("main:get_experiences_json"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        experience = response.json()[0]
        self.assertEqual(experience["pk"], str(self.experience.id))
        self.assertEqual(experience["fields"]["title"], self.experience.title)
        self.assertEqual(experience["fields"]["category_display"], "Part-Time")
        self.assertEqual(experience["fields"]["star_count"], 0)
        self.assertFalse(experience["fields"]["is_starred"])

    def test_create_experience(self):
        response = self.client.get(reverse("main:create_experience"))

        self.assertRedirects(
            response,
            f"{reverse('main:login')}?next={reverse('main:create_experience')}",
        )

    def test_only_superuser_can_create_experience(self):
        self.client.force_login(self.regular_user)
        response = self.client.post(
            reverse("main:create_experience"),
            {
                "title": "Public Relations Intern",
                "description": "Managed communication strategies.",
                "category": "internship",
                "thumbnail": "",
                "start_date": "2025-09-01",
                "end_date": "2025-12-01",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(
            Experience.objects.filter(title="Public Relations Intern").exists()
        )

        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_experience"),
            {
                "title": "Public Relations Intern",
                "description": "Managed communication strategies.",
                "category": "internship",
                "thumbnail": "",
                "start_date": "2025-09-01",
                "end_date": "2025-12-01",
            },
        )

        self.assertRedirects(response, reverse("main:show_experience"))
        self.assertTrue(
            Experience.objects.filter(title="Public Relations Intern").exists()
        )

    def test_update_experience(self):
        self.client.force_login(self.editor)
        response = self.client.post(
            reverse(
                "main:update_experience",
                kwargs={"experience_id": self.experience.id},
            ),
            {
                "title": "Updated Experience",
                "description": self.experience.description,
                "category": "full-time",
                "thumbnail": "",
                "start_date": "2026-01-01",
                "end_date": "",
            },
        )

        self.assertRedirects(response, reverse("main:show_experience"))
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.title, "Updated Experience")
        self.assertEqual(self.experience.category, "full-time")

    def test_regular_user_cannot_update_experience(self):
        self.client.force_login(self.regular_user)
        response = self.client.post(
            reverse(
                "main:update_experience",
                kwargs={"experience_id": self.experience.id},
            ),
            {
                "title": "Unauthorized update",
                "description": self.experience.description,
                "category": "full-time",
                "thumbnail": "",
                "start_date": "2026-01-01",
                "end_date": "",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.experience.refresh_from_db()
        self.assertNotEqual(self.experience.title, "Unauthorized update")

    def test_delete_experience(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse(
                "main:delete_experience",
                kwargs={"experience_id": self.experience.id},
            )
        )

        self.assertRedirects(response, reverse("main:show_experience"))
        self.assertFalse(Experience.objects.filter(pk=self.experience.id).exists())

    def test_editor_cannot_delete_experience(self):
        self.client.force_login(self.editor)
        response = self.client.post(
            reverse(
                "main:delete_experience",
                kwargs={"experience_id": self.experience.id},
            )
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Experience.objects.filter(pk=self.experience.id).exists())

    def test_logged_in_user_can_toggle_experience_star(self):
        self.client.force_login(self.regular_user)
        star_url = reverse(
            "main:toggle_experience_star",
            kwargs={"experience_id": self.experience.id},
        )

        response = self.client.post(star_url)
        self.assertRedirects(response, reverse("main:show_experience"))
        self.assertTrue(self.experience.starred_by.filter(pk=self.regular_user.pk).exists())

        self.client.post(star_url)
        self.assertFalse(self.experience.starred_by.filter(pk=self.regular_user.pk).exists())

    def test_experience_star_requires_login(self):
        response = self.client.post(
            reverse(
                "main:toggle_experience_star",
                kwargs={"experience_id": self.experience.id},
            )
        )

        self.assertRedirects(
            response,
            f"{reverse('main:login')}?next=/experience/{self.experience.id}/star/",
        )

    def test_experiences_json_uses_usernames_for_stars(self):
        self.experience.starred_by.add(self.regular_user)
        self.client.force_login(self.regular_user)
        response = self.client.get(reverse("main:get_experiences_json"))

        fields = response.json()[0]["fields"]
        self.assertEqual(fields["star_count"], 1)
        self.assertTrue(fields["is_starred"])
        self.assertEqual(fields["starred_by_names"], ["reader"])

    def test_projects_url_is_accessible(self):
        response = self.client.get(reverse("main:show_projects"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "projects.html")

    def test_projects_page_provides_ajax_container(self):
        response = self.client.get(reverse("main:show_projects"))

        self.assertContains(response, 'id="projects-grid"')
        self.assertContains(response, reverse("main:get_projects_json"))
        self.assertNotContains(response, 'id="add-project-modal"')
        self.assertNotContains(response, self.project.title)

    def test_superuser_sees_add_project_modal(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("main:show_projects"))

        self.assertContains(response, 'popovertarget="add-project-modal"')
        self.assertContains(response, 'id="add-project-modal"')
        self.assertContains(response, 'id="project-form"')
        self.assertContains(response, 'action="{}"'.format(reverse("main:create_project")))
        self.assertContains(
            response,
            'data-ajax-url="{}"'.format(reverse("main:create_project_ajax")),
        )

    def test_superuser_can_create_project_with_ajax(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_project_ajax"),
            {
                "title": "AJAX Portfolio",
                "description": "Created without a page reload.",
                "technology_stack": "Django, JavaScript",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Project.objects.filter(title="AJAX Portfolio").exists())

    def test_ajax_create_project_rejects_non_superuser(self):
        self.client.force_login(self.regular_user)
        response = self.client.post(
            reverse("main:create_project_ajax"),
            {
                "title": "Unauthorized Project",
                "description": "Should not be saved.",
                "technology_stack": "Django",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Project.objects.filter(title="Unauthorized Project").exists())

    def test_ajax_create_project_returns_validation_errors(self):
        self.client.force_login(self.superuser)
        response = self.client.post(
            reverse("main:create_project_ajax"),
            {
                "title": "<img src=x>",
                "description": "Safe description.",
                "technology_stack": "Django",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.json()["errors"])

    def test_ajax_create_project_only_accepts_post(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("main:create_project_ajax"))

        self.assertEqual(response.status_code, 405)

    def test_projects_json_contains_ajax_fields(self):
        self.project.starred_by.add(self.regular_user)
        self.client.force_login(self.regular_user)
        response = self.client.get(reverse("main:get_projects_json"))

        self.assertEqual(response.status_code, 200)
        project = response.json()[0]
        self.assertEqual(project["pk"], str(self.project.id))
        self.assertEqual(project["fields"]["title"], self.project.title)
        self.assertEqual(project["fields"]["technology_items"], ["Django", "Python"])
        self.assertEqual(project["fields"]["star_count"], 1)
        self.assertTrue(project["fields"]["is_starred"])
        self.assertEqual(project["fields"]["starred_by_names"], ["reader"])

    def test_projects_json_search(self):
        Project.objects.create(
            title="YouWell",
            description="A wellness companion.",
            technology_stack="Flutter, Dart",
        )
        response = self.client.get(
            reverse("main:get_projects_json"),
            {"title": "Focus"},
        )

        self.assertEqual(
            [project["fields"]["title"] for project in response.json()],
            ["FocusBuddy"],
        )

    def test_update_project(self):
        response = self.client.post(
            reverse(
                "main:update_project",
                kwargs={"project_id": self.project.id},
            ),
            {
                "title": "FocusBuddy Updated",
                "description": self.project.description,
                "technology_stack": self.project.technology_stack,
                "project_url": "",
                "project_image_url": "",
            },
        )

        self.assertRedirects(response, reverse("main:show_projects"))
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, "FocusBuddy Updated")

    def test_empty_projects_api(self):
        Project.objects.all().delete()
        response = self.client.get(reverse("main:get_projects_json"))

        self.assertEqual(response.json(), [])
