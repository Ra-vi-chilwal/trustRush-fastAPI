from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, StringConstraints

# "Asha@X.com " and "asha@x.com" are the same account.
NormalizedEmail = Annotated[EmailStr, AfterValidator(lambda v: v.strip().lower())]
FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
City = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class UserCreate(BaseModel):
    full_name: FullName
    email: NormalizedEmail
    password: str = Field(min_length=8, max_length=128)
    city: City | None = None


class UserLogin(BaseModel):
    email: NormalizedEmail
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    city: str | None
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    """Refresh token is NOT here: it is set as an httpOnly cookie."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds
