from django.forms import DateInput, ModelForm, Textarea, TextInput, URLInput

from main.models import Experience, Project


class ExperienceForm(ModelForm):
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
            "title": "Nama Pengalaman",
            "description": "Deskripsi Pengalaman",
            "category": "Kategori",
            "thumbnail": "URL Gambar",
            "start_date": "Tanggal Mulai",
            "end_date": "Tanggal Selesai",
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
                    "placeholder": "Ceritakan pengalamanmu",
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
            "description",
            "technology_stack",
            "project_url",
            "project_image_url",
        ]
        labels = {
            "title": "Nama Proyek",
            "description": "Deskripsi Proyek",
            "technology_stack": "Teknologi yang Digunakan",
            "project_url": "URL Proyek",
            "project_image_url": "URL Gambar Proyek",
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
                    "placeholder": "Ceritakan proyekmu",
                    "rows": 4,
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
