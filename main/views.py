import datetime

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

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
        "total_roles": all_experiences.count(),
        "category_filters": category_filters,
        "is_editor": is_editor(request.user),
    }
    return render(request, "experience.html", context)


def get_experiences_json(request):
    experiences = Experience.objects.prefetch_related("starred_by").all()
    search_query = request.GET.get("q", "").strip()
    category = request.GET.get("category", "").strip()
    sort_order = request.GET.get("sort", "newest").strip()

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

    data = []
    for experience in experiences:
        starred_users = list(experience.starred_by.all())
        data.append(
            {
                "pk": str(experience.id),
                "fields": {
                    "title": experience.title,
                    "description": experience.description,
                    "category": experience.category,
                    "category_display": experience.get_category_display(),
                    "thumbnail": experience.thumbnail,
                    "start_date": (
                        experience.start_date.isoformat()
                        if experience.start_date
                        else None
                    ),
                    "end_date": (
                        experience.end_date.isoformat()
                        if experience.end_date
                        else None
                    ),
                    "is_ongoing": experience.is_ongoing,
                    "star_count": len(starred_users),
                    "is_starred": (
                        request.user.is_authenticated
                        and any(user.pk == request.user.pk for user in starred_users)
                    ),
                    "starred_by_names": [user.username for user in starred_users],
                },
            }
        )

    return JsonResponse(data, safe=False)


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


def get_projects_json(request):
    search_query = request.GET.get("title", "").strip()
    projects = Project.objects.prefetch_related("starred_by").all()

    if search_query:
        projects = projects.filter(
            Q(title__icontains=search_query)
            | Q(subtitle__icontains=search_query)
            | Q(description__icontains=search_query)
            | Q(feature_one_title__icontains=search_query)
            | Q(feature_two_title__icontains=search_query)
            | Q(technology_stack__icontains=search_query)
        )

    data = []
    for project in projects:
        starred_users = list(project.starred_by.all())
        data.append(
            {
                "pk": str(project.id),
                "fields": {
                    "title": project.title,
                    "subtitle": project.subtitle,
                    "description": project.description,
                    "feature_one_title": project.feature_one_title,
                    "feature_one_description": project.feature_one_description,
                    "feature_two_title": project.feature_two_title,
                    "feature_two_description": project.feature_two_description,
                    "technology_stack": project.technology_stack,
                    "technology_items": project.technology_items,
                    "project_url": project.project_url,
                    "project_image_url": project.project_image_url,
                    "created_at": project.created_at.isoformat(),
                    "star_count": len(starred_users),
                    "is_starred": (
                        request.user.is_authenticated
                        and any(user.pk == request.user.pk for user in starred_users)
                    ),
                    "starred_by_names": [user.username for user in starred_users],
                },
            }
        )

    return JsonResponse(data, safe=False)


def show_projects(request):
    context = {
        "name": "Alfredo Harsono",
        "title_query": request.GET.get("title", "").strip(),
        "form": ProjectForm(),
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


@require_POST
def create_project_ajax(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"message": "Only the portfolio owner can add projects."},
            status=403,
        )

    form = ProjectForm(request.POST)
    if form.is_valid():
        project = form.save()
        return JsonResponse(
            {"message": "Project added successfully.", "pk": str(project.id)},
            status=201,
        )

    return JsonResponse({"errors": form.errors.get_json_data()}, status=400)


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
