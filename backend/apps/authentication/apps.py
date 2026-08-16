from django.apps import AppConfig
from django.db.models.signals import post_migrate


def setup_admin_user(sender, **kwargs):
    import os
    from django.contrib.auth import get_user_model
    from django.db.utils import OperationalError, ProgrammingError
    from apps.authentication.models import RoleChoices
    from apps.team.models import Profile, EmploymentTypeChoices, StatusChoices

    User = get_user_model()
    try:
        if not User.objects.filter(role=RoleChoices.ADMIN).exists():
            admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@maango.com')
            admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD', 'admin123')

            print(f"No admin user found. Creating default admin user with email: {admin_email}")
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password=admin_password,
                first_name='Admin',
                last_name='User'
            )

            # Create Profile for the admin user
            Profile.objects.get_or_create(
                user=admin_user,
                defaults={
                    'name': 'Admin User',
                    'employment_type': EmploymentTypeChoices.FULL_TIME,
                    'status': StatusChoices.ACTIVE,
                    'bio': 'System Administrator'
                }
            )
            print("Successfully created default admin user and profile.")
    except (OperationalError, ProgrammingError):
        # Database tables might not be created/migrated yet
        pass


class AuthenticationConfig(AppConfig):
    name = 'apps.authentication'

    def ready(self):
        # Register the post_migrate signal to create admin after migrations run
        post_migrate.connect(setup_admin_user)


