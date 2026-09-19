from django.forms import DateInput, ModelForm, Textarea, TextInput, URLInput

from main.models import Experience, Project


class ExperienceForm(ModelForm):
    DISPLAYED_CATEGORY_CHOICES = [
        ("", "Select category"),
        ("full-time", "Full-Time"),
        ("internship", "Internship"),
        ("volunteer", "Volunteer"),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["category"].choices = self.DISPLAYED_CATEGORY_CHOICES

    class Meta:
        model = Experience
        fields = [
            "title",
            "description",
            "category",
            "thumbnail",
            "start_date",
            "end_date",
        ]
        labels = {
            "title": "Experience Title",
            "description": "Experience Description",
            "category": "Category",
            "thumbnail": "Image URL",
            "start_date": "Start Date",
            "end_date": "End Date",
        }
        widgets = {
            "title": TextInput(
                attrs={
                    "placeholder": "Deputy of Departemen Keilmuan Mahasiswa",
                    "maxlength": 255,
                }
            ),
            "description": Textarea(
                attrs={
                    "placeholder": "Describe your experience",
                    "rows": 5,
                }
            ),
            "thumbnail": URLInput(
                attrs={
                    "placeholder": "https://example.com/image.jpg",
                }
            ),
            "start_date": DateInput(attrs={"type": "date"}),
            "end_date": DateInput(attrs={"type": "date"}),
        }


class ProjectForm(ModelForm):
    class Meta:
        model = Project
        fields = [
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
        ]
        labels = {
            "title": "Project Name",
            "subtitle": "Subtitle",
            "description": "Project Description",
            "feature_one_title": "Feature 1 Title",
            "feature_one_description": "Feature 1 Description",
            "feature_two_title": "Feature 2 Title",
            "feature_two_description": "Feature 2 Description",
            "technology_stack": "Technology Stack",
            "project_url": "Project URL",
            "project_image_url": "Project Image URL",
        }
        widgets = {
            "title": TextInput(
                attrs={
                    "placeholder": "Portfolio Website",
                    "maxlength": 255,
                }
            ),
            "description": Textarea(
                attrs={
                    "placeholder": "Describe your project",
                    "rows": 4,
                }
            ),
            "subtitle": TextInput(
                attrs={
                    "placeholder": "Short project tagline",
                    "maxlength": 255,
                }
            ),
            "feature_one_title": TextInput(
                attrs={"placeholder": "Feature title"}
            ),
            "feature_one_description": Textarea(
                attrs={
                    "placeholder": "Short feature description",
                    "rows": 3,
                }
            ),
            "feature_two_title": TextInput(
                attrs={"placeholder": "Feature title"}
            ),
            "feature_two_description": Textarea(
                attrs={
                    "placeholder": "Short feature description",
                    "rows": 3,
                }
            ),
            "technology_stack": TextInput(
                attrs={
                    "placeholder": "Django, Python, HTML, CSS",
                }
            ),
            "project_url": URLInput(
                attrs={
                    "placeholder": "https://github.com/kakBurhan/burhanquestv4",
                }
            ),
            "project_image_url": URLInput(
                attrs={
                    "placeholder": "https://drive.google.com/thumbnail?id=...&sz=w1000",
                }
            ),
        }
