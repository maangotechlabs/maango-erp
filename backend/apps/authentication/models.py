from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings


class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    CHIEF = 'CHIEF', 'Chief'
    MANAGEMENT = 'MANAGEMENT', 'Management'
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    INTERN = 'INTERN', 'Intern'
    FELLOW = 'FELLOW', 'Fellow'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role=RoleChoices.EMPLOYEE, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', RoleChoices.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    must_change_password = models.BooleanField(default=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.EMPLOYEE,
        db_index=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin_or_chief(self):
        return self.role in [RoleChoices.ADMIN, RoleChoices.CHIEF]

    @property
    def is_management_or_above(self):
        return self.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]


class NotificationTypeChoices(models.TextChoices):
    TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned'
    TASK_UPDATED = 'TASK_UPDATED', 'Task Updated'
    PROJECT_UPDATED = 'PROJECT_UPDATED', 'Project Updated'
    DEADLINE_REMINDER = 'DEADLINE_REMINDER', 'Deadline Reminder'
    MENTION = 'MENTION', 'Mention Notification'
    SYSTEM = 'SYSTEM', 'System Notification'


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationTypeChoices.choices,
        default=NotificationTypeChoices.SYSTEM
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email} - {self.title} (Read: {self.is_read})"


class ActivityLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=255)
    module = models.CharField(max_length=50)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.email if self.user else "System"
        return f"{user_str} - {self.action} ({self.created_at})"
