-- Add onboarding fields to User table
ALTER TABLE "User" ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "skippedOnboarding" BOOLEAN NOT NULL DEFAULT false;