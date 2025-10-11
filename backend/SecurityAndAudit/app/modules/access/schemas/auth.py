"""
Authentication schemas (DTOs)
Matches the contract defined in cliente_web/src/services/auth.service.ts
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class LoginCredentials(BaseModel):
    """
    Login request payload
    Matches: interface LoginCredentials from auth.service.ts
    """

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, description="User's password")

    model_config = {
        "json_schema_extra": {
            "examples": [{"email": "admin@example.com", "password": "admin123"}]
        }
    }


class UserInfo(BaseModel):
    """
    User information included in auth response
    Matches: user object in AuthResponse from auth.service.ts
    """

    id: str = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    name: str = Field(..., description="User's display name (username)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "admin@example.com",
                    "name": "admin",
                }
            ]
        }
    }


class AuthResponse(BaseModel):
    """
    Authentication response
    Matches: interface AuthResponse from auth.service.ts
    """

    token: str = Field(..., description="JWT authentication token")
    user: UserInfo = Field(..., description="Authenticated user information")
    permissions: Optional[List[str]] = Field(
        default=None, description="List of permission names the user has"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "user": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "admin@example.com",
                        "name": "admin",
                    },
                    "permissions": [
                        "view_reports",
                        "create_document",
                        "edit_document",
                        "delete_document",
                    ],
                }
            ]
        }
    }


class TokenValidationRequest(BaseModel):
    """
    Token validation request
    """

    token: str = Field(..., description="JWT token to validate")

    model_config = {
        "json_schema_extra": {
            "examples": [{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}]
        }
    }


class TokenValidationResponse(BaseModel):
    """
    Token validation response
    Matches the return type of validateToken from auth.service.ts
    """

    valid: bool = Field(..., description="Whether the token is valid")
    user_id: Optional[str] = Field(
        default=None, description="User ID if token is valid"
    )
    email: Optional[str] = Field(
        default=None, description="User email if token is valid"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "valid": True,
                    "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "admin@example.com",
                }
            ]
        }
    }


class UserProfileResponse(BaseModel):
    """
    Current user profile response (for /auth/me endpoint)
    """

    id: str
    username: str
    email: str
    profile_id: str
    profile_name: str
    is_active: bool
    permissions: List[str]
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "username": "admin",
                    "email": "admin@example.com",
                    "profile_id": "660e8400-e29b-41d4-a716-446655440001",
                    "profile_name": "Administrator",
                    "is_active": True,
                    "permissions": ["view_reports", "create_document", "edit_document"],
                    "last_login_at": "2024-10-11T16:30:00Z",
                    "created_at": "2024-01-01T00:00:00Z",
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """
    Standard error response
    """

    detail: str = Field(..., description="Error message")

    model_config = {
        "json_schema_extra": {"examples": [{"detail": "Invalid credentials"}]}
    }
