from django.db import models

class CompanyProfile(models.Model):
    name = models.CharField(max_length=255, default="MaAngo Tech Labs")
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    website = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        db_table = 'company_profile'
        verbose_name = 'Company Profile'
        verbose_name_plural = 'Company Profile'

    def save(self, *args, **kwargs):
        # Enforce singleton
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class WorkingDays(models.Model):
    monday = models.BooleanField(default=True)
    tuesday = models.BooleanField(default=True)
    wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True)
    friday = models.BooleanField(default=True)
    saturday = models.BooleanField(default=False)
    sunday = models.BooleanField(default=False)

    class Meta:
        db_table = 'working_days'
        verbose_name = 'Working Days'
        verbose_name_plural = 'Working Days'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Working Days Configuration"


class Holiday(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'holidays'
        ordering = ['date']

    def __str__(self):
        return f"{self.name} - {self.date}"
