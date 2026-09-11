from django.shortcuts import render

from main.models import Experience, Project


def show_main(request):
    context = {
        "name": "Alfredo Harsono",
        "npm": "2506656412",
        "study_program": "S1 Sistem Informasi",
        "bio": (
            "Be great or just be good"
        ),
    }
    return render(request, "index.html", context)


def show_experience(request):
    context = {
        "name": "Alfredo Harsono",
        "experience_list": Experience.objects.order_by("-start_date"),
    }
    return render(request, "experience.html", context)


def show_projects(request):
    context = {
        "name": "Alfredo Harsono",
        "project_list": Project.objects.order_by("-created_at"),
    }
    return render(request, "projects.html", context)
