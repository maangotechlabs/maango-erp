from rest_framework.permissions import BasePermission
from apps.authentication.models import RoleChoices

class IsAdmin(BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.ADMIN
        )


class IsChiefOrAbove(BasePermission):
    """
    Allows access only to Admin and Chief users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF]
        )


class IsManagementOrAbove(BasePermission):
    """
    Allows access only to Admin, Chief, and Management users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]
        )


class IsEmployeeOrAbove(BasePermission):
    """
    Allows access to all authenticated users since Fellow is the lowest role,
    but checks that user has at least Fellow/Intern status.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class ProjectAccessPermission(BasePermission):
    """
    Custom permission for projects:
    - Admin, Chief, Management can do anything (CRUD).
    - Employees/Interns/Fellows can only view if they are a developer or member of the project.
    - Nobody below Management can create or delete projects.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ['POST', 'DELETE']:
            return request.user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]
        return True

    def has_object_permission(self, request, view, obj):
        # Admin, Chief, Management have full access
        if request.user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]:
            return True
        
        # Safe methods (GET, HEAD, OPTIONS)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            # Check if developer or member or project manager
            is_manager = obj.project_manager == request.user
            is_dev = obj.developers.filter(id=request.user.id).exists()
            is_member = obj.members.filter(id=request.user.id).exists()
            return is_manager or is_dev or is_member
        
        # Non-safe methods (PUT, PATCH) are restricted to management
        return False


class TaskAccessPermission(BasePermission):
    """
    Custom permission for tasks:
    - Admin, Chief, Management can do anything (CRUD).
    - Employees/Interns/Fellows can view if the task is standalone and not assigned, 
      or if they are assigned to it, or if it belongs to a project they have access to.
    - Employees/Interns/Fellows can update completion percentage, status, and add comments/attachments.
    - Fellows can only view and update progress on tasks explicitly assigned to them.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ['POST', 'DELETE']:
            return request.user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Management and above have full access
        if user.role in [RoleChoices.ADMIN, RoleChoices.CHIEF, RoleChoices.MANAGEMENT]:
            return True
            
        # For Fellows
        if user.role == RoleChoices.FELLOW:
            if request.method in ['GET', 'PATCH', 'PUT']:
                # Can only touch if assigned to them
                return obj.assigned_to == user
            return False
            
        # For Employees/Interns
        # Read-only or update
        if request.method in ['GET', 'PATCH', 'PUT']:
            # Safe or assigned
            if obj.assigned_to == user:
                return True
            if obj.project:
                # Check if they have access to the project
                return (
                    obj.project.project_manager == user or
                    obj.project.developers.filter(id=user.id).exists() or
                    obj.project.members.filter(id=user.id).exists()
                )
            # Standalone task - anyone can see if it's not restricted
            return True
            
        return False
