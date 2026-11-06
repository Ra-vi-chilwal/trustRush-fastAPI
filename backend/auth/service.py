import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.models import RefreshToken, User
from auth.schemas import UserCreate
from auth.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)


class EmailTakenError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


@dataclass(frozen=True)
class IssuedTokens:
    access_token: str
    refresh_token: str
    refresh_expires_at: datetime


# ---------- users ----------

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        full_name=data.full_name,
        email=data.email.lower(),
        city=data.city,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Two signups for the same email at the same moment: the UNIQUE
        # constraint is the real guard, the pre-check in the route is just a fast path.
        db.rollback()
        raise EmailTakenError from None
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        verify_password(password, DUMMY_PASSWORD_HASH)  # same cost as a real check
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


# ---------- refresh tokens ----------

def _add_refresh_token(db: Session, user_id: int, family_id: str) -> tuple[str, datetime]:
    token, expires_at = create_refresh_token(user_id)
    db.add(
        RefreshToken(
            user_id=user_id,
            family_id=family_id,
            token_hash=hash_token(token),
            expires_at=expires_at,
        )
    )
    return token, expires_at


def issue_tokens(db: Session, user_id: int) -> IssuedTokens:
    """Login: start a new token family."""
    refresh, expires_at = _add_refresh_token(db, user_id, str(uuid.uuid4()))
    db.commit()
    return IssuedTokens(create_access_token(user_id), refresh, expires_at)


def _revoke_family(db: Session, family_id: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(UTC))
    )


def rotate_refresh_token(db: Session, token: str) -> IssuedTokens:
    """Swap a valid refresh token for a new pair.

    The revoke is a single conditional UPDATE, so if two requests race with the
    same token only one of them flips revoked false -> true (rowcount == 1).
    The loser is treated exactly like a reuse attack.
    """
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(token)))
    if stored is None:
        raise InvalidRefreshTokenError

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:  # some drivers (e.g. SQLite) return naive datetimes
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        raise InvalidRefreshTokenError

    token_id, user_id, family_id = stored.id, stored.user_id, stored.family_id

    result = db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token_id, RefreshToken.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(UTC))
    )
    if result.rowcount != 1:
        # Already rotated: someone is replaying an old token. Kill this login.
        db.rollback()
        _revoke_family(db, family_id)
        db.commit()
        raise InvalidRefreshTokenError

    refresh, expires_at = _add_refresh_token(db, user_id, family_id)
    db.commit()
    return IssuedTokens(create_access_token(user_id), refresh, expires_at)


def revoke_refresh_token(db: Session, token: str) -> None:
    """Logout: revoke the whole family of this token (this device's session)."""
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(token)))
    if stored is not None:
        _revoke_family(db, stored.family_id)
        db.commit()
