from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    full_name: str
    username: str
    email: EmailStr
    profile_image: str | None = None
    phone: str | None = None
    location: str | None = None
    university: str | None = None
    faculty: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    education_level: str | None = None
    skills: list[str] = []
    interests: list[str] = []
    preferred_categories: list[str] = []
    preferred_locations: list[str] = []
    bio: str | None = None
    role: str
    is_verified: bool
    onboarding_complete: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicUserOut(BaseModel):
    username: str
    full_name: str
    profile_image: str | None = None
    location: str | None = None
    university: str | None = None
    faculty: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    education_level: str | None = None
    skills: list[str] = []
    interests: list[str] = []
    bio: str | None = None
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = "STUDENT"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=10)
    password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    location: str | None = Field(default=None, max_length=120)
    university: str | None = Field(default=None, max_length=160)
    faculty: str | None = Field(default=None, max_length=160)
    department: str | None = Field(default=None, max_length=160)
    graduation_year: int | None = Field(default=None, ge=1990, le=2040)
    education_level: str | None = Field(default=None, max_length=40)
    skills: list[str] | None = None
    interests: list[str] | None = None
    preferred_categories: list[str] | None = None
    preferred_locations: list[str] | None = None
    bio: str | None = Field(default=None, max_length=1000)
    profile_image: str | None = Field(default=None, max_length=500)


class OnboardingIn(BaseModel):
    university: str = Field(min_length=2, max_length=160)
    faculty: str = Field(min_length=2, max_length=160)
    department: str = Field(min_length=2, max_length=160)
    education_level: str = Field(min_length=2, max_length=40)
    graduation_year: int = Field(ge=1990, le=2040)
    interests: list[str] = Field(min_length=1)
    skills: list[str] = Field(min_length=1)
    preferred_categories: list[str] = Field(min_length=1)
    preferred_locations: list[str] = Field(min_length=1)
    location: str | None = None


class OrganizationBrief(BaseModel):
    id: str
    name: str
    slug: str
    logo: str | None = None
    verified: bool = False
    location: str | None = None

    model_config = {"from_attributes": True}


class OrganizationOut(OrganizationBrief):
    description: str
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    created_at: datetime
    opportunity_count: int = 0


class OrganizationIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: str = ""
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    logo: str | None = None
    verified: bool = False


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str
    color: str
    opportunity_count: int = 0

    model_config = {"from_attributes": True}


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = ""
    icon: str = "Sparkles"
    color: str = "#0C6B58"


class OpportunityCard(BaseModel):
    id: str
    title: str
    slug: str
    short_description: str
    organization: OrganizationBrief
    category: CategoryOut
    opportunity_type: str
    location: str
    country: str
    is_remote: bool
    deadline: datetime | None = None
    image: str | None = None
    tags: list[str] = []
    skills: list[str] = []
    featured: bool
    status: str
    views: int
    created_at: datetime
    bookmarked: bool = False
    application_status: str | None = None
    days_remaining: int | None = None
    recommendation_reason: str | None = None


class OpportunityDetail(OpportunityCard):
    description: str
    eligibility: str
    requirements: str
    benefits: str
    application_url: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    education_levels: list[str] = []
    updated_at: datetime


class OpportunityIn(BaseModel):
    title: str = Field(min_length=4, max_length=200)
    short_description: str = Field(min_length=10, max_length=320)
    description: str = Field(min_length=20, max_length=20000)
    organization_id: str
    category_id: str
    opportunity_type: str
    location: str = Field(min_length=2, max_length=120)
    country: str = Field(min_length=2, max_length=80)
    is_remote: bool = False
    eligibility: str = ""
    requirements: str = ""
    benefits: str = ""
    application_url: str
    deadline: datetime | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    image: str | None = None
    tags: list[str] = []
    skills: list[str] = []
    education_levels: list[str] = []
    featured: bool = False
    status: str = "APPROVED"


class PageOut(BaseModel):
    items: list[OpportunityCard]
    total: int
    page: int
    page_size: int


class BookmarkIn(BaseModel):
    opportunity_id: str


class ApplicationIn(BaseModel):
    opportunity_id: str
    status: str = "SAVED"
    notes: str = ""


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


class ApplicationOut(BaseModel):
    id: str
    status: str
    notes: str
    applied_at: datetime | None = None
    updated_at: datetime
    opportunity: OpportunityCard


class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    link: str | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=2, max_length=2000)
    type: str = "SYSTEM"
    user_email: str | None = None


class ReportIn(BaseModel):
    opportunity_id: str
    reason: str = Field(min_length=2, max_length=80)
    description: str = Field(default="", max_length=2000)


class ReportOut(BaseModel):
    id: str
    reason: str
    description: str
    status: str
    created_at: datetime
    user_name: str
    user_email: str
    opportunity_title: str
    opportunity_slug: str


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    opportunities: list[OpportunityCard] = []
    created_at: datetime


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationDetail(ConversationOut):
    messages: list[ChatMessageOut]


class ChatResponse(BaseModel):
    reply: str
    opportunities: list[OpportunityCard]
    conversation_id: str | None = None


class HomeOut(BaseModel):
    stats: dict[str, int]
    latest: list[OpportunityCard]
    closing_soon: list[OpportunityCard]
    featured: list[OpportunityCard]
    categories: list[CategoryOut]
    organizations: list[OrganizationOut]
    announcement: str = ""


class SearchOut(BaseModel):
    query: str
    opportunities: list[OpportunityCard]
    organizations: list[OrganizationOut]
    related_categories: list[CategoryOut]
    suggestions: list[str]
    total: int


class AnalyticsOut(BaseModel):
    totals: dict[str, int]
    by_category: list[dict[str, int | str]]
    by_month: list[dict[str, int | str]]
    registrations: list[dict[str, int | str]]
    application_activity: list[dict[str, int | str]]
    popular_categories: list[dict[str, int | str]]


class SettingsOut(BaseModel):
    site_name: str
    support_email: str
    announcement: str


class AdminUserUpdate(BaseModel):
    role: str | None = None
    is_verified: bool | None = None


class MessageOut(BaseModel):
    message: str
    reset_token: str | None = None
