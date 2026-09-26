import datetime

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.core.exceptions import PermissionDenied
from django.core import serializers
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from main.forms import ExperienceForm, ProjectForm
from main.models import Experience, Project


EDITOR_GROUP_NAME = "Editor"


def is_editor(user):
    return (
        user.is_authenticated
        and user.groups.filter(name=EDITOR_GROUP_NAME).exists()
    )


def can_edit_experience(user):
    return user.is_superuser or is_editor(user)


def show_main(request):
    last_login = request.COOKIES.get("last_login", "Not available")
    context = {
        "name": "Alfredo Harsono",
        "npm": "2506656412",
        "study_program": "S1 Sistem Informasi",
        "bio": (
            "Be great or just be good"
        ),
        "last_login": last_login,
    }
    return render(request, "index.html", context)


def register(request):
    form = UserCreationForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Account created successfully. Please log in.")
        return redirect("main:login")

    context = {
        "name": "Alfredo Harsono",
        "form": form,
    }
    return render(request, "register.html", context)


def login_user(request):
    form = AuthenticationForm(request, data=request.POST or None)

    if request.method == "POST" and form.is_valid():
        login(request, form.get_user())
        response = redirect("main:show_main")
        response.set_cookie(
            "last_login",
            datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        return response

    context = {
        "name": "Alfredo Harsono",
        "form": form,
    }
    return render(request, "login.html", context)


def logout_user(request):
    logout(request)
    response = redirect("main:show_main")
    response.delete_cookie("last_login")
    return response


def show_experience(request):
    json_response = get_experiences_json(request, apply_filters=False)
    experiences = serializers.deserialize(
        "json",
        json_response.content.decode("utf-8"),
    )
    experiences = [experience.object for experience in experiences]

    all_experiences = Experience.objects.all()
    category_options = [
        ("full-time", "Full-Time"),
        ("internship", "Internship"),
        ("volunteer", "Volunteer"),
    ]
    category_filters = [
        {
            "value": value,
            "label": label,
            "count": all_experiences.filter(category=value).count(),
        }
        for value, label in category_options
    ]

    context = {
        "name": "Alfredo Harsono",
        "experience_list": experiences,
        "total_roles": all_experiences.count(),
        "category_filters": category_filters,
        "is_editor": is_editor(request.user),
    }
    return render(request, "experience.html", context)


def get_experiences_json(request, apply_filters=True):
    experiences = Experience.objects.all()
    search_query = request.GET.get("q", "").strip() if apply_filters else ""
    category = request.GET.get("category", "").strip() if apply_filters else ""
    sort_order = request.GET.get("sort", "newest").strip() if apply_filters else "newest"

    allowed_categories = {choice[0] for choice in Experience.EXPERIENCE_CHOICES}
    if category in allowed_categories:
        experiences = experiences.filter(category=category)
    if search_query:
        experiences = experiences.filter(
            Q(title__icontains=search_query)
            | Q(description__icontains=search_query)
        )

    if sort_order == "oldest":
        experiences = experiences.order_by("start_date")
    else:
        experiences = experiences.order_by("-start_date")

    experiences_json = serializers.serialize(
        "json", experiences, use_natural_foreign_keys=True
    )
    return HttpResponse(experiences_json, content_type="application/json")


@login_required(login_url="/login/")
def create_experience(request):
    if not request.user.is_superuser:
        raise PermissionDenied

    form = ExperienceForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Experience added successfully!")
        return redirect("main:show_experience")

    context = {
        "name": "Alfredo Harsono",
        "form": form,
        "experience": None,
    }
    return render(request, "experience_form.html", context)


@login_required(login_url="/login/")
def update_experience(request, experience_id):
    if not can_edit_experience(request.user):
        raise PermissionDenied

    experience = get_object_or_404(Experience, pk=experience_id)
    form = ExperienceForm(request.POST or None, instance=experience)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Experience updated successfully!")
        return redirect("main:show_experience")

    context = {
        "name": "Alfredo Harsono",
        "form": form,
        "experience": experience,
    }
    return render(request, "experience_form.html", context)


@login_required(login_url="/login/")
def delete_experience(request, experience_id):
    if not request.user.is_superuser:
        raise PermissionDenied

    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        experience.delete()
        messages.success(request, "Experience deleted successfully!")

    return redirect("main:show_experience")


@login_required(login_url="/login/")
def toggle_experience_star(request, experience_id):
    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        if request.user in experience.starred_by.all():
            experience.starred_by.remove(request.user)
        else:
            experience.starred_by.add(request.user)

    return redirect("main:show_experience")


def get_projects_json(request, apply_filters=True):
    title_query = request.GET.get("title", "").strip() if apply_filters else ""
    projects = Project.objects.all()

    if title_query:
        projects = projects.filter(title__icontains=title_query)

    projects_json = serializers.serialize(
        "json", projects, use_natural_foreign_keys=True
    )
    return HttpResponse(projects_json, content_type="application/json")


def show_projects(request):
    json_response = get_projects_json(request, apply_filters=False)
    projects = serializers.deserialize(
        "json",
        json_response.content.decode("utf-8"),
    )
    projects = [project.object for project in projects]

    context = {
        "name": "Alfredo Harsono",
        "project_list": projects,
    }
    return render(request, "projects.html", context)


@login_required(login_url="/login/")
def create_project(request):
    if not request.user.is_superuser:
        raise PermissionDenied

    form = ProjectForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Project added successfully!")
        return redirect("main:show_projects")

    context = {
        "name": "Alfredo Harsono",
        "form": form,
        "project": None,
    }
    return render(request, "projects_form.html", context)


def update_project(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    form = ProjectForm(request.POST or None, instance=project)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Project updated successfully!")
        return redirect("main:show_projects")

    context = {
        "name": "Alfredo Harsono",
        "form": form,
        "project": project,
    }
    return render(request, "projects_form.html", context)


@login_required(login_url="/login/")
def delete_project(request, project_id):
    if not request.user.is_superuser:
        raise PermissionDenied

    project = get_object_or_404(Project, pk=project_id)

    if request.method == "POST":
        project.delete()
        messages.success(request, "Project deleted successfully!")

    return redirect("main:show_projects")


@login_required(login_url="/login/")
def toggle_star(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    if request.method == "POST":
        if request.user in project.starred_by.all():
            project.starred_by.remove(request.user)
        else:
            project.starred_by.add(request.user)

    return redirect("main:show_projects")
