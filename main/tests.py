from datetime import date

from django.test import TestCase
from django.urls import reverse

from main.models import Experience, Project


class MainTest(TestCase):
    def setUp(self):
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
        self.assertContains(response, self.experience.title)
        self.assertContains(response, self.experience.description)
        self.assertContains(response, "Jan 2026")
        self.assertContains(response, "Present")
        self.assertContains(response, f'href="{reverse("main:show_main")}"')

    def test_empty_experience_page(self):
        Experience.objects.all().delete()
        response = self.client.get(reverse("main:show_experience"))

        self.assertContains(response, "No experience yet")

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
        response = self.client.get(reverse("main:show_experience"))

        self.assertFalse(self.experience.is_ongoing)
        self.assertContains(response, "Feb 2026")
        self.assertNotContains(response, "Present")

    def test_experiences_json(self):
        response = self.client.get(reverse("main:get_experiences_json"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.json()[0]["fields"]["title"], self.experience.title)

    def test_create_experience(self):
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

    def test_delete_experience(self):
        response = self.client.post(
            reverse(
                "main:delete_experience",
                kwargs={"experience_id": self.experience.id},
            )
        )

        self.assertRedirects(response, reverse("main:show_experience"))
        self.assertFalse(Experience.objects.filter(pk=self.experience.id).exists())

    def test_projects_url_is_accessible(self):
        response = self.client.get(reverse("main:show_projects"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "projects.html")

    def test_projects_page_shows_project(self):
        response = self.client.get(reverse("main:show_projects"))

        self.assertContains(response, self.project.title)
        self.assertContains(response, self.project.description)

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

    def test_empty_projects_page(self):
        Project.objects.all().delete()
        response = self.client.get(reverse("main:show_projects"))

        self.assertContains(response, "No projects have been added yet.")
