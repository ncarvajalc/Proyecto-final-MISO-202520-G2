import asyncio
from typing import List, Tuple
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.modules.access.models import Profile, Permission, ProfilePermission, User
from app.modules.access.schemas.auth import LoginCredentials
from app.modules.access.services.auth_service import AuthService, pwd_context


def _create_user_with_permissions(
    session,
    *,
    email: str | None = None,
    password: str = "password123",
    is_active: bool = True,
    permission_names: List[str] | None = None,
) -> Tuple[User, str, List[str], Profile]:
    if email is None:
        email = f"user_{uuid4().hex[:8]}@example.com"
    if permission_names is None:
        permission_names = ["view_reports"]

    profile = Profile(profile_name=f"Profile-{uuid4().hex[:6]}")
    session.add(profile)
    session.commit()
    session.refresh(profile)

    created_permissions: List[str] = []
    for name in permission_names:
        permission = Permission(permission_name=name)
        session.add(permission)
        session.commit()
        session.refresh(permission)
        session.add(
            ProfilePermission(profile_id=profile.id, permission_id=permission.id)
        )
        session.commit()
        created_permissions.append(name)

    username = email.split("@")[0]
    user = User(
        username=username,
        email=email,
        password_hash=pwd_context.hash(password),
        profile_id=profile.id,
        is_active=is_active,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user, password, created_permissions, profile


def test_authenticate_successfully_returns_token_and_permissions(db_session):
    user, plain_password, permissions, _ = _create_user_with_permissions(
        db_session,
        email="alice@example.com",
        password="alice-password",
        permission_names=["manage_users", "edit_orders"],
    )

    service = AuthService(db_session)
    credentials = LoginCredentials(email=user.email, password=plain_password)

    response = asyncio.run(service.authenticate(credentials))

    assert response.user.id == user.id
    assert response.user.email == "alice@example.com"
    assert set(response.permissions or []) == {"manage_users", "edit_orders"}
    assert response.token

    db_session.refresh(user)
    assert user.last_login_at is not None


def test_authenticate_raises_for_unknown_email(db_session):
    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email="ghost@example.com", password="secret")
            )
        )

    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail


def test_authenticate_rejects_inactive_user(db_session):
    user, _, _, _ = _create_user_with_permissions(
        db_session, email="bob@example.com", is_active=False
    )

    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email=user.email, password="password123")
            )
        )

    assert exc_info.value.status_code == 403
    assert "inactive" in exc_info.value.detail


def test_authenticate_rejects_invalid_password(db_session):
    user, _, _, _ = _create_user_with_permissions(
        db_session, email="carol@example.com"
    )

    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email=user.email, password="wrong-password")
            )
        )

    assert exc_info.value.status_code == 401


def test_validate_token_returns_valid_payload(db_session):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, email="dana@example.com"
    )
    service = AuthService(db_session)
    token = asyncio.run(
        service.authenticate(
            LoginCredentials(email=user.email, password=plain_password)
        )
    ).token

    validation = asyncio.run(service.validate_token(f"Bearer {token}"))

    assert validation.valid is True
    assert validation.user_id == user.id
    assert validation.email == user.email


def test_validate_token_returns_invalid_when_user_inactive(db_session):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, email="erin@example.com"
    )
    service = AuthService(db_session)
    token = asyncio.run(
        service.authenticate(
            LoginCredentials(email=user.email, password=plain_password)
        )
    ).token

    user.is_active = False
    db_session.add(user)
    db_session.commit()

    validation = asyncio.run(service.validate_token(f"Bearer {token}"))

    assert validation.valid is False
    assert validation.user_id is None
    assert validation.email is None


def test_validate_token_handles_missing_header(db_session):
    service = AuthService(db_session)

    validation = asyncio.run(service.validate_token(None))

    assert validation.valid is False
    assert validation.user_id is None


def test_get_current_user_returns_profile_information(db_session):
    user, plain_password, permissions, profile = _create_user_with_permissions(
        db_session,
        email="frank@example.com",
        permission_names=["perm_a", "perm_b"],
    )
    service = AuthService(db_session)
    token = asyncio.run(
        service.authenticate(
            LoginCredentials(email=user.email, password=plain_password)
        )
    ).token

    profile_response = asyncio.run(service.get_current_user(f"Bearer {token}"))

    assert profile_response.id == user.id
    assert profile_response.email == user.email
    assert profile_response.profile_id == profile.id
    assert profile_response.profile_name == profile.profile_name
    assert set(profile_response.permissions) == set(permissions)


def test_get_current_user_requires_authorization_header(db_session):
    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.get_current_user(None))

    assert exc_info.value.status_code == 401
    assert "authorization" in exc_info.value.detail.lower()


def test_get_current_user_raises_for_invalid_token(db_session):
    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.get_current_user("Bearer invalid"))

    assert exc_info.value.status_code == 401


def test_get_current_user_handles_missing_user(db_session):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, email="gina@example.com"
    )
    service = AuthService(db_session)
    token = asyncio.run(
        service.authenticate(
            LoginCredentials(email=user.email, password=plain_password)
        )
    ).token

    db_session.delete(user)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.get_current_user(f"Bearer {token}"))

    assert exc_info.value.status_code == 404


def test_get_current_user_handles_inactive_user(db_session):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, email="helen@example.com"
    )
    service = AuthService(db_session)
    token = asyncio.run(
        service.authenticate(
            LoginCredentials(email=user.email, password=plain_password)
        )
    ).token

    user.is_active = False
    db_session.add(user)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(service.get_current_user(f"Bearer {token}"))

    assert exc_info.value.status_code == 403
    assert "inactive" in exc_info.value.detail
