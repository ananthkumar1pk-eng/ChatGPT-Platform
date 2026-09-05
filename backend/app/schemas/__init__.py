"""
Pydantic Schemas Package Initialization.
"""

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserOut,
)
from app.schemas.chat import (
    SourceCitation,
    FeedbackCreate,
    FeedbackOut,
    MessageOut,
    MessageCreate,
    EditMessageRequest,
    ConversationCreate,
    ConversationUpdate,
    ConversationOut,
    ConversationDetailOut,
)
from app.schemas.document import (
    ChunkOut,
    DocumentOut,
    DocumentDetailOut,
    RAGQueryRequest,
    RAGSearchResult,
)
from app.schemas.user import (
    UserProfileUpdate,
    UserSettingsUpdate,
    UserSettingsOut,
    AvailableModel,
)

__all__ = [
    "UserRegister",
    "UserLogin",
    "GoogleAuthRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    "UserOut",
    "SourceCitation",
    "FeedbackCreate",
    "FeedbackOut",
    "MessageOut",
    "MessageCreate",
    "EditMessageRequest",
    "ConversationCreate",
    "ConversationUpdate",
    "ConversationOut",
    "ConversationDetailOut",
    "ChunkOut",
    "DocumentOut",
    "DocumentDetailOut",
    "RAGQueryRequest",
    "RAGSearchResult",
    "UserProfileUpdate",
    "UserSettingsUpdate",
    "UserSettingsOut",
    "AvailableModel",
]
