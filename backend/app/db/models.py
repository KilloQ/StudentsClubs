from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_teacher = Column(Boolean, default=False, nullable=False)

    # Relationships
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

    # Relationships
    owner = relationship("User", back_populates="owned_clubs", foreign_keys=[owner_id])
    memberships = relationship("ClubMembership", back_populates="club", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="club", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="club")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    day_of_week = Column(String, nullable=False)  # Понедельник, Вторник, etc.
    start_time = Column(Time, nullable=False)
    location = Column(String, nullable=False)

    # Relationships
    club = relationship("Club", back_populates="schedules")


class ClubMembership(Base):
    __tablename__ = "club_memberships"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(Date, default=datetime.now().date(), nullable=False)

    # Relationships
    club = relationship("Club", back_populates="memberships")
    student = relationship("User", back_populates="memberships")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    marked_at = Column(Date, default=datetime.now().date(), nullable=False)

    # Relationships
    club = relationship("Club", back_populates="attendances")
    student = relationship("User", back_populates="attendances")

