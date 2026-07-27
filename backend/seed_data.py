import os
import django
from datetime import date, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.authentication.models import RoleChoices
from apps.system_settings.models import Department, WorkingDays, Holiday
from apps.team.models import Profile, GenderChoices, EmploymentTypeChoices, StatusChoices
from apps.projects.models import Project, ProjectStatusChoices, ProjectPriorityChoices
from apps.tasks.models import Task, TaskStatusChoices, TaskPriorityChoices, Comment

User = get_user_model()

def seed():
    print("Starting database seeding...")

    # 1. Seed Working Days
    wd, created = WorkingDays.objects.get_or_create(id=1)
    wd.monday = True
    wd.tuesday = True
    wd.wednesday = True
    wd.thursday = True
    wd.friday = True
    wd.saturday = False
    wd.sunday = False
    wd.save()
    print("Seeded Working Days configuration.")

    # 2. Seed Departments
    departments = [
        ('Engineering', 'ENG'),
        ('Product Management', 'PM'),
        ('Design & UX', 'DSN'),
        ('Operations', 'OPS'),
        ('Human Resources', 'HR'),
    ]
    dept_objs = {}
    for name, code in departments:
        dept, created = Department.objects.get_or_create(name=name, code=code)
        dept_objs[code] = dept
        print(f"Seeded Department: {name} ({code})")

    # 3. Seed Holidays
    holidays = [
        ('New Year\'s Day', date(2026, 1, 1), 'Start of the new year'),
        ('Independence Day', date(2026, 8, 15), 'National Independence Day'),
        ('Republic Day', date(2026, 1, 26), 'National Republic Day'),
        ('Christmas Day', date(2026, 12, 25), 'Christmas holiday'),
    ]
    for name, dt, desc in holidays:
        Holiday.objects.get_or_create(name=name, date=dt, defaults={'description': desc})
        print(f"Seeded Holiday: {name} on {dt}")

    # 4. Seed Users and Profiles
    users_data = [
        ('admin@maango.com', 'admin123', RoleChoices.ADMIN, 'Alice', 'Admin', 'ENG', EmploymentTypeChoices.FULL_TIME),
        ('chief@maango.com', 'chief123', RoleChoices.CHIEF, 'Charlie', 'Chief', 'OPS', EmploymentTypeChoices.FULL_TIME),
        ('manager@maango.com', 'manager123', RoleChoices.MANAGEMENT, 'Mary', 'Manager', 'PM', EmploymentTypeChoices.FULL_TIME),
        ('employee@maango.com', 'employee123', RoleChoices.EMPLOYEE, 'Ed', 'Employee', 'ENG', EmploymentTypeChoices.FULL_TIME),
        ('intern@maango.com', 'intern123', RoleChoices.INTERN, 'Ian', 'Intern', 'DSN', EmploymentTypeChoices.INTERNSHIP),
        ('fellow@maango.com', 'fellow123', RoleChoices.FELLOW, 'Fiona', 'Fellow', 'ENG', EmploymentTypeChoices.FELLOWSHIP),
    ]

    user_objs = {}
    for email, pw, role, f_name, l_name, dept_code, emp_type in users_data:
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                password=pw,
                role=role,
                first_name=f_name,
                last_name=l_name
            )
            print(f"Created User: {email} with role {role}")
        else:
            user.role = role
            user.first_name = f_name
            user.last_name = l_name
            user.set_password(pw)
            user.save()
            print(f"Updated User: {email}")

        user_objs[role] = user

        # Create Profile
        profile = Profile.objects.filter(user=user).first()
        if not profile:
            profile = Profile.objects.create(
                user=user,
                name=f"{f_name} {l_name}",
                gender=GenderChoices.MALE if role != RoleChoices.FELLOW else GenderChoices.FEMALE,
                dob=date(1990 + len(role), 1, 1),
                phone='+91 9876543210',
                address='123 Tech Labs Street, Bangalore, India',
                emergency_contact='Emergency Contact: +91 9999988888',
                department=dept_objs[dept_code],
                employment_type=emp_type,
                status=StatusChoices.ACTIVE,
                skills=['Python', 'Django', 'React', 'TypeScript'] if dept_code == 'ENG' else ['Product Strategy', 'UI/UX Design'],
                github='https://github.com/maango',
                linkedin='https://linkedin.com/company/maango',
                bio=f"Hello, I am {f_name}, working in {dept_code} department."
            )
            print(f"Created Profile for: {f_name} ({profile.employee_id})")
        else:
            profile.name = f"{f_name} {l_name}"
            profile.department = dept_objs[dept_code]
            profile.save()

    # 5. Seed Projects
    projects_data = [
        ('MaAngo ERP Platform', 'Enterprise Resource Planning software for Tech Labs', 'Client Tech', ProjectPriorityChoices.CRITICAL, ProjectStatusChoices.IN_PROGRESS, 200, 15),
        ('Vite Client App', 'Modern Client Portal dashboard', 'Internal Product', ProjectPriorityChoices.HIGH, ProjectStatusChoices.PLANNING, 80, 0),
    ]

    project_objs = []
    for name, desc, client, priority, status_val, est, act in projects_data:
        proj = Project.objects.filter(name=name).first()
        if not proj:
            proj = Project.objects.create(
                name=name,
                description=desc,
                client=client,
                priority=priority,
                status=status_val,
                estimated_hours=est,
                actual_hours=act,
                project_manager=user_objs[RoleChoices.MANAGEMENT]
            )
            proj.developers.add(user_objs[RoleChoices.EMPLOYEE], user_objs[RoleChoices.FELLOW])
            proj.members.add(user_objs[RoleChoices.INTERN])
            proj.save()
            print(f"Created Project: {name}")
        project_objs.append(proj)

    # 6. Seed Tasks
    tasks_data = [
        ('Database Schema Design', 'Design PostgreSQL schemas and relation structures', project_objs[0], user_objs[RoleChoices.EMPLOYEE], TaskPriorityChoices.CRITICAL, TaskStatusChoices.COMPLETED, 20, 12, 100),
        ('JWT Middleware Implementation', 'Build JWT authentication layer and middleware', project_objs[0], user_objs[RoleChoices.EMPLOYEE], TaskPriorityChoices.HIGH, TaskStatusChoices.IN_PROGRESS, 15, 6, 40),
        ('UI Wireframes Design', 'Create layout wires for ERP dashboards', project_objs[0], user_objs[RoleChoices.INTERN], TaskPriorityChoices.MEDIUM, TaskStatusChoices.IN_PROGRESS, 10, 8, 80),
        ('Fellow Progress Reporting', 'Report task lists and progress weekly', project_objs[0], user_objs[RoleChoices.FELLOW], TaskPriorityChoices.LOW, TaskStatusChoices.PENDING, 5, 0, 0),
        ('Standalone Deployment Review', 'Verify deployment checklist configurations', None, user_objs[RoleChoices.CHIEF], TaskPriorityChoices.HIGH, TaskStatusChoices.PENDING, 8, 0, 0),
    ]

    for name, desc, proj, assigned, priority, status_val, est, act, pct in tasks_data:
        task = Task.objects.filter(name=name).first()
        if not task:
            task = Task.objects.create(
                name=name,
                description=desc,
                project=proj,
                assigned_to=assigned,
                priority=priority,
                status=status_val,
                estimated_time=est,
                actual_time=act,
                completion_percentage=pct,
                start_date=date.today() - timedelta(days=2),
                due_date=date.today() + timedelta(days=5),
            )
            print(f"Created Task: {name}")

            # Add sample comment on task
            Comment.objects.create(
                task=task,
                user=user_objs[RoleChoices.MANAGEMENT],
                content=f"Please prioritize this. @{assigned.email} let me know if you need help."
            )
            print(f"Added comment on task: {name}")

    # 7. Seed Announcements
    from apps.announcements.models import Announcement
    ann_data = [
        ("Welcome to MaAngo ERP V2", "We have transitioned to our new simplified, high-speed SaaS-style ERP workspace! Meet Notion/Linear style tasks.", user_objs[RoleChoices.ADMIN]),
        ("Sprint Review Meeting", "Our sprint review is scheduled for Monday at 10 AM. All developers and fellows please join on time.", user_objs[RoleChoices.CHIEF]),
    ]
    for title, desc, author in ann_data:
        ann = Announcement.objects.filter(title=title).first()
        if not ann:
            Announcement.objects.create(title=title, description=desc, author=author)
            print(f"Created Announcement: {title}")

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
