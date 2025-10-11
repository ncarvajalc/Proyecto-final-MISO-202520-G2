"""
Authentication routes
Implements the authentication endpoints following the contract from auth.service.ts
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.modules.access.schemas.auth import (
    LoginCredentials,
    AuthResponse,
    TokenValidationResponse,
    UserProfileResponse,
    ErrorResponse,
)
from app.modules.access.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Login successful", "model": AuthResponse},
        401: {"description": "Invalid credentials", "model": ErrorResponse},
        422: {"description": "Validation error"},
    },
    summary="User login",
    description="""
    Authenticate a user with email and password.
    
    Returns a JWT token and user information with permissions.
    This endpoint matches the login function from auth.service.ts
    
    **Flow:**
    1. Validate email and password format
    2. Find user by email
    3. Verify password hash
    4. Get user's profile and permissions
    5. Generate JWT token
    6. Return token + user info + permissions
    """,
)
async def login(
    credentials: LoginCredentials, db: Session = Depends(get_db)
) -> AuthResponse:
    """
    Login endpoint

    Args:
        credentials: Email and password
        db: Database session

    Returns:
        AuthResponse with token, user info, and permissions

    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 422: Validation error
    """
    auth_service = AuthService(db)
    return await auth_service.authenticate(credentials)


@router.post(
    "/validate",
    response_model=TokenValidationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Token validation result",
            "model": TokenValidationResponse,
        }
    },
    summary="Validate JWT token",
    description="""
    Validate a JWT token and return its validity status.
    This endpoint matches the validateToken function from auth.service.ts
    
    **Flow:**
    1. Decode JWT token
    2. Check expiration
    3. Verify signature
    4. Return validation result with user info if valid
    """,
)
async def validate_token(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> TokenValidationResponse:
    """
    Validate JWT token

    Args:
        authorization: Bearer token from Authorization header
        db: Database session

    Returns:
        TokenValidationResponse with validity status
    """
    auth_service = AuthService(db)
    return await auth_service.validate_token(authorization)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Current user profile", "model": UserProfileResponse},
        401: {
            "description": "Unauthorized - invalid or missing token",
            "model": ErrorResponse,
        },
    },
    summary="Get current user profile",
    description="""
    Get the profile of the currently authenticated user.
    Requires a valid JWT token in the Authorization header.
    
    **Flow:**
    1. Extract token from Authorization header
    2. Validate and decode token
    3. Get user information from database
    4. Get user's permissions
    5. Return complete user profile
    """,
)
async def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> UserProfileResponse:
    """
    Get current authenticated user's profile

    Args:
        authorization: Bearer token from Authorization header
        db: Database session

    Returns:
        UserProfileResponse with complete user information

    Raises:
        HTTPException 401: Invalid or missing token
    """
    auth_service = AuthService(db)
    return await auth_service.get_current_user(authorization)
