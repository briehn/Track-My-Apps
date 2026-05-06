-- CreateEnum
CREATE TYPE "ExperienceRange" AS ENUM (
    'ZERO_TO_ONE',
    'ONE_TO_TWO',
    'THREE_TO_FIVE',
    'SIX_TO_NINE',
    'TEN_PLUS'
);

-- AlterTable
ALTER TABLE "UserProfile"
ADD COLUMN "workPreferences" "RemoteType"[] NOT NULL DEFAULT ARRAY[]::"RemoteType"[],
ADD COLUMN "yearsOfExperienceNew" "ExperienceRange";

-- Backfill existing single-value work preferences into the new enum array.
UPDATE "UserProfile"
SET "workPreferences" = ARRAY["workPreference"]::"RemoteType"[]
WHERE "workPreference" IS NOT NULL;

-- Map the previous numeric value into the new stored range.
UPDATE "UserProfile"
SET "yearsOfExperienceNew" = CASE
    WHEN "yearsOfExperience" IS NULL THEN NULL
    WHEN "yearsOfExperience" <= 1 THEN 'ZERO_TO_ONE'::"ExperienceRange"
    WHEN "yearsOfExperience" <= 2 THEN 'ONE_TO_TWO'::"ExperienceRange"
    WHEN "yearsOfExperience" <= 5 THEN 'THREE_TO_FIVE'::"ExperienceRange"
    WHEN "yearsOfExperience" <= 9 THEN 'SIX_TO_NINE'::"ExperienceRange"
    ELSE 'TEN_PLUS'::"ExperienceRange"
END;

-- Drop old columns after data has been copied across.
ALTER TABLE "UserProfile"
DROP COLUMN "workPreference",
DROP COLUMN "yearsOfExperience";

-- Rename the new enum-backed range column into the canonical field name.
ALTER TABLE "UserProfile"
RENAME COLUMN "yearsOfExperienceNew" TO "yearsOfExperience";
