"""
Authentication service
Business logic for authentication and authorization
"""

import os
from datetime import UTC, datetime, timedelta
from typing import List, Optional

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

os.environ.setdefault("PASSLIB_DISABLE_CRYPT", "1")

from app.modules.access.schemas.auth import (
    LoginCredentials,
    AuthResponse,
    UserInfo,
    TokenValidationResponse,
    UserProfileResponse,
)
from app.modules.access.models import User, Profile, Permission, ProfilePermission
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES


class AuthService:
    """
    Authentication service class
    Handles all authentication and authorization logic
    """

    def __init__(self, db: Session):
        self.db = db

    async def authenticate(self, credentials: LoginCredentials) -> AuthResponse:
        """
        Authenticate user with email and password

        Implementation steps:
        1. Find user by email
        2. Verify user exists and is active
        3. Verify password matches hash
        4. Get user's permissions from profile
        5. Generate JWT token
        6. Update last_login_at
        7. Return AuthResponse

        Args:
            credentials: Login credentials (email, password)

        Returns:
            AuthResponse with token, user info, and permissions

        Raises:
            HTTPException 401: Invalid credentials
            HTTPException 403: User account is inactive
        """
        # Step 1: Find user by email
        user = self.db.query(User).filter(User.email == credentials.email).first()

        # Step 2: Verify user exists
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Step 3: Verify user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Step 4: Verify password
        if not self._verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Step 5: Get user's permissions
        permissions = self._get_user_permissions(user)

        # Step 6: Generate JWT token
        token = self._generate_jwt_token(user)

        # Step 7: Update last_login_at
        user.last_login_at = datetime.now(UTC)
        self.db.commit()

        # Step 8: Build and return AuthResponse
        return AuthResponse(
            token=token,
            user=UserInfo(
                id=user.id,
                email=user.email,
                name=user.username,
            ),
            permissions=permissions,
        )

    async def validate_token(
        self, authorization: Optional[str]
    ) -> TokenValidationResponse:
        """
        Validate JWT token

        Implementation steps:
        1. Extract token from Authorization header
        2. Decode JWT token
        3. Verify signature and expiration
        4. Get user from token payload
        5. Verify user still exists and is active
        6. Return validation result

        Args:
            authorization: Bearer token from Authorization header

        Returns:
            TokenValidationResponse with validity status
        """
        # Step 1: Extract token from header
        token = self._extract_token_from_header(authorization)

        if not token:
            return TokenValidationResponse(valid=False, user_id=None, email=None)

        try:
            # Step 2 & 3: Decode and verify JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")

            if user_id is None or email is None:
                return TokenValidationResponse(valid=False, user_id=None, email=None)

            # Step 4 & 5: Verify user still exists and is active
            user = self.db.query(User).filter(User.id == user_id).first()

            if not user or not user.is_active:
                return TokenValidationResponse(valid=False, user_id=None, email=None)

            # Step 6: Return validation result
            return TokenValidationResponse(valid=True, user_id=user_id, email=email)

        except JWTError:
            return TokenValidationResponse(valid=False, user_id=None, email=None)

    async def get_current_user(
        self, authorization: Optional[str]
    ) -> UserProfileResponse:
        """
        Get current authenticated user's profile

        Implementation steps:
        1. Validate token
        2. Extract user_id from token
        3. Fetch user from database with profile
        4. Get user's permissions
        5. Return complete user profile

        Args:
            authorization: Bearer token from Authorization header

        Returns:
            UserProfileResponse with complete user information

        Raises:
            HTTPException 401: Invalid or missing token
            HTTPException 404: User not found
        """
        # Step 1: Extract and validate token
        token = self._extract_token_from_header(authorization)

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header",
            )

        try:
            # Step 2: Decode token and extract user_id
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")

            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )

        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        # Step 3: Fetch user from database with profile
        user = self.db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Step 4: Get user's permissions
        permissions = self._get_user_permissions(user)

        # Step 5: Get profile information
        profile = self.db.query(Profile).filter(Profile.id == user.profile_id).first()

        # Step 6: Build and return UserProfileResponse
        return UserProfileResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            profile_id=user.profile_id,
            profile_name=profile.profile_name if profile else "Unknown",
            is_active=user.is_active,
            permissions=permissions,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
        )

    def _generate_jwt_token(self, user: User) -> str:
        """
        Generate JWT token for user

        Implementation steps:
        1. Create token payload with user_id, email, profile_id
        2. Set expiration time
        3. Encode with secret key
        4. Return token string

        Args:
            user: User model instance

        Returns:
            JWT token string
        """
        # Step 1: Create payload with user data
        # Step 2: Set expiration time
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        now = datetime.now(UTC)
        expire = now + expires_delta

        payload = {
            "sub": user.id,  # Subject - user ID
            "email": user.email,
            "profile_id": user.profile_id,
            "exp": expire,  # Expiration time
            "iat": now,  # Issued at
        }

        # Step 3: Encode with secret key
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

        # Step 4: Return token string
        return token

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify password against hash

        Implementation: Use passlib to verify password

        Args:
            plain_password: Plain text password
            hashed_password: Bcrypt hashed password

        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)

    def _get_user_permissions(self, user: User) -> List[str]:
        """
        Get list of permission names for user

        Implementation steps:
        1. Get user's profile
        2. Get profile's permissions through profile_permission
        3. Extract permission names
        4. Return list of permission names

        Args:
            user: User model instance

        Returns:
            List of permission names
        """
        # Step 1 & 2: Query permissions through profile_permission join
        permissions = (
            self.db.query(Permission)
            .join(ProfilePermission, ProfilePermission.permission_id == Permission.id)
            .filter(ProfilePermission.profile_id == user.profile_id)
            .all()
        )

        # Step 3 & 4: Extract permission names and return
        return [permission.permission_name for permission in permissions]

    def _extract_token_from_header(self, authorization: Optional[str]) -> Optional[str]:
        """
        Extract JWT token from Authorization header

        Implementation steps:
        1. Check if authorization header exists
        2. Verify it starts with "Bearer "
        3. Extract and return token

        Args:
            authorization: Authorization header value

        Returns:
            Token string or None
        """
        # Step 1: Check if header exists
        if not authorization:
            return None

        # Step 2: Verify format (Bearer token)
        if not authorization.startswith("Bearer "):
            return None

        # Step 3: Extract and return token
        token = authorization.replace("Bearer ", "")
        return token
