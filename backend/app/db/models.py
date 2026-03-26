from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    ROLES = ("student", "teacher", "admin")

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_teacher = Column(Boolean, default=False, nullable=False)
    role = Column(String(20), default="student", nullable=False)

    owned_clubs = relationship("Club", back_populates="owner", foreign_keys="Club.owner_id")
    memberships = relationship("ClubMembership", back_populates="student")
    attendances = relationship("Attendance", back_populates="student")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, nullable=False)
    max_students = Column(Integer, nullable=False)
    recruitment_open = Column(Boolean, default=True, nullable=False)
    image_url = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="owned_clubs", foreign_keys=[owner_id])
    memberships = relationship("ClubMembership", back_populates="club", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="club", cascade="all, delete-orphan")
    files = relationship("ClubFile", back_populates="club", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="club")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    day_of_week = Column(String, nullable=False)
    start_time = Column(Time, nullable=False)
    location = Column(String, nullable=False)


    club = relationship("Club", back_populates="schedules")


class ClubMembership(Base):
    __tablename__ = "club_memberships"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(Date, default=datetime.now().date(), nullable=False)


    club = relationship("Club", back_populates="memberships")
    student = relationship("User", back_populates="memberships")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    marked_at = Column(Date, default=datetime.now().date(), nullable=False)


    club = relationship("Club", back_populates="attendances")
    student = relationship("User", back_populates="attendances")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    token_hash = Column(String(64), unique=True, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    revoked_at = Column(DateTime, nullable=True, index=True)
    revoked_reason = Column(String(50), nullable=True)
    last_used_at = Column(DateTime, nullable=True)


class ClubFile(Base):
    __tablename__ = "club_files"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_name = Column(String(255), nullable=False)
    object_key = Column(String(512), nullable=False, unique=True)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    club = relationship("Club", back_populates="files")

