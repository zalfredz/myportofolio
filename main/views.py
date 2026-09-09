from django.shortcuts import render

from main.models import Experience


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
        "name": "Alfredo",
        "experience_list": Experience.objects.order_by("-start_date"),
    }
    return render(request, "experience.html", context)
