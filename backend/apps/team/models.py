from django.db import models
from django.conf import settings
from datetime import date
from apps.system_settings.models import Department

class GenderChoices(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'
    OTHER = 'OTHER', 'Other'


class EmploymentTypeChoices(models.TextChoices):
    FULL_TIME = 'FULL_TIME', 'Full-time'
    PART_TIME = 'PART_TIME', 'Part-time'
    CONTRACT = 'CONTRACT', 'Contract'
    INTERNSHIP = 'INTERNSHIP', 'Internship'
    FELLOWSHIP = 'FELLOWSHIP', 'Fellowship'


class StatusChoices(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    PROBATION = 'PROBATION', 'Probation'


class DocumentTypeChoices(models.TextChoices):
    MASKED_AADHAAR = 'MASKED_AADHAAR', 'Masked Aadhaar'
    PASSPORT = 'PASSPORT', 'Passport'
    DRIVING_LICENCE = 'DRIVING_LICENCE', 'Driving Licence'
    VOTER_ID = 'VOTER_ID', 'Voter ID'
    OTHER = 'OTHER', 'Other'


class VerificationStatusChoices(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=GenderChoices.choices, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.TextField(blank=True)
    joining_date = models.DateField(default=date.today)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='profiles')
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentTypeChoices.choices,
        default=EmploymentTypeChoices.FULL_TIME
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE
    )
    skills = models.JSONField(default=list, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return f"{self.name} ({self.employee_id or 'No ID'})"

    @property
    def age(self):
        if self.dob:
            today = date.today()
            return today.year - self.dob.year - ((today.month, today.day) < (self.dob.month, self.dob.day))
        return None

    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Generate sequential ID e.g., MTE-2026-001
            year = self.joining_date.year if self.joining_date else date.today().year
            last_profile = Profile.objects.filter(employee_id__startswith=f"MTE-{year}-").order_by('-employee_id').first()
            if last_profile:
                try:
                    last_num = int(last_profile.employee_id.split('-')[-1])
                    new_num = last_num + 1
                except ValueError:
                    new_num = 1
            else:
                new_num = 1
            self.employee_id = f"MTE-{year}-{new_num:03d}"
        super().save(*args, **kwargs)


class IdentityVerification(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='identity_verification')
    document_type = models.CharField(
        max_length=20,
        choices=DocumentTypeChoices.choices,
        default=DocumentTypeChoices.MASKED_AADHAAR
    )
    # Stored in private_media directory, out of static media url lookup
    document_file = models.FileField(upload_to='identity_docs/')
    status = models.CharField(
        max_length=20,
        choices=VerificationStatusChoices.choices,
        default=VerificationStatusChoices.PENDING
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_identities'
    )
    verified_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'identity_verifications'

    def __str__(self):
        return f"Identity of {self.profile.name} - {self.status}"


class DocumentScopeChoices(models.TextChoices):
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    PROJECT = 'PROJECT', 'Project'
    TASK = 'TASK', 'Task'
    GENERAL = 'GENERAL', 'General'


class Document(models.Model):
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents'
    )
    scope = models.CharField(
        max_length=20,
        choices=DocumentScopeChoices.choices,
        default=DocumentScopeChoices.GENERAL
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documents'
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documents'
    )
    profile_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='profile_documents'
    )
    
    version = models.IntegerField(default=1)
    parent_document = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='revisions'
    )
    
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} (v{self.version})"
