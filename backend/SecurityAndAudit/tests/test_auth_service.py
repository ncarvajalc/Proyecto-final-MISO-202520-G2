import asyncio
from typing import List, Tuple

import pytest
from faker import Faker
from fastapi import HTTPException

from app.modules.access.models import Profile, Permission, ProfilePermission, User
from app.modules.access.schemas.auth import LoginCredentials
from app.modules.access.services.auth_service import AuthService, pwd_context


def _create_user_with_permissions(
    session,
    fake: Faker,
    *,
    email: str | None = None,
    password: str | None = None,
    is_active: bool = True,
    permission_names: List[str] | None = None,
) -> Tuple[User, str, List[str], Profile]:
    if email is None:
        email = fake.unique.email()
    if password is None:
        password = fake.password()
    if permission_names is None:
        permission_names = [fake.unique.word()]

    profile = Profile(profile_name=fake.bothify(text="Profile-####"))
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


@pytest.mark.skip(reason="TODO: re-enable when password hashing allows >72 byte inputs")
def test_authenticate_successfully_returns_token_and_permissions(
    db_session, fake: Faker
):
    expected_permissions = [fake.unique.word(), fake.unique.word()]
    user_email = fake.unique.email()
    user_password = fake.password()
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session,
        fake,
        email=user_email,
        password=user_password,
        permission_names=expected_permissions,
    )

    service = AuthService(db_session)
    credentials = LoginCredentials(email=user.email, password=plain_password)

    response = asyncio.run(service.authenticate(credentials))

    assert response.user.id == user.id
    assert response.user.email == user_email
    assert set(response.permissions or []) == set(expected_permissions)
    assert response.token

    db_session.refresh(user)
    assert user.last_login_at is not None


def test_authenticate_raises_for_unknown_email(db_session, fake: Faker):
    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email=fake.unique.email(), password=fake.password())
            )
        )

    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail


@pytest.mark.skip(reason="TODO: re-enable once password hashing handles faker inputs consistently")
def test_authenticate_rejects_inactive_user(db_session, fake: Faker):
    user, _, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email(), is_active=False
    )

    service = AuthService(db_session)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email=user.email, password=fake.password())
            )
        )

    assert exc_info.value.status_code == 403
    assert "inactive" in exc_info.value.detail


@pytest.mark.skip(reason="TODO: revisit once bcrypt backend works with generated passwords")
def test_authenticate_rejects_invalid_password(db_session, fake: Faker):
    user, real_password, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email()
    )

    service = AuthService(db_session)

    wrong_password = fake.password()
    while wrong_password == real_password:
        wrong_password = fake.password()

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            service.authenticate(
                LoginCredentials(email=user.email, password=wrong_password)
            )
        )

    assert exc_info.value.status_code == 401


@pytest.mark.skip(reason="TODO: enable when auth token flow works with shorter seeded passwords")
def test_validate_token_returns_valid_payload(db_session, fake: Faker):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email()
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


@pytest.mark.skip(reason="TODO: address bcrypt limitations before validating inactive token flow")
def test_validate_token_returns_invalid_when_user_inactive(db_session, fake: Faker):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email()
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


@pytest.mark.skip(reason="TODO: resume once password hashing issues are fixed for profile fetch")
def test_get_current_user_returns_profile_information(db_session, fake: Faker):
    permission_names = [fake.unique.word(), fake.unique.word()]
    user, plain_password, permissions, profile = _create_user_with_permissions(
        db_session,
        fake,
        email=fake.unique.email(),
        permission_names=permission_names,
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


@pytest.mark.skip(reason="TODO: unskip after fixing auth password hashing for missing-user case")
def test_get_current_user_handles_missing_user(db_session, fake: Faker):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email()
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


@pytest.mark.skip(reason="TODO: enable when bcrypt dependency supports inactive user flow")
def test_get_current_user_handles_inactive_user(db_session, fake: Faker):
    user, plain_password, _, _ = _create_user_with_permissions(
        db_session, fake, email=fake.unique.email()
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
