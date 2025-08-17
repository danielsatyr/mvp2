/*
  Warnings:

  - You are about to drop the column `createdAt` on the `EligibilityFactors` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EligibilityFactors` table. All the data in the column will be lost.
  - You are about to drop the column `186` on the `Occupation` table. All the data in the column will be lost.
  - You are about to drop the column `407` on the `Occupation` table. All the data in the column will be lost.
  - You are about to drop the column `482` on the `Occupation` table. All the data in the column will be lost.
  - You are about to drop the column `485` on the `Occupation` table. All the data in the column will be lost.
  - You are about to drop the column `494` on the `Occupation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EligibilityFactors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" TEXT NOT NULL,
    "anzscoCode" TEXT,
    "visa" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pathway" TEXT,
    "englishLevelRequired" TEXT,
    "workExperienceStateYears" INTEGER,
    "studyInStateRequired" BOOLEAN DEFAULT false,
    "stateOccId" TEXT,
    "occupationName" TEXT,
    "valueRaw" TEXT,
    "minPointsState" INTEGER,
    "streamName" TEXT,
    "visa190Flag" BOOLEAN,
    "visa491Flag" BOOLEAN,
    "workExperienceState" BOOLEAN,
    "workExperienceOverseasYears" INTEGER,
    "workExperienceDescription" TEXT,
    "studyTimeStateRequired" INTEGER,
    "studyInStateLevel" TEXT,
    "jobOfferRequired" BOOLEAN,
    "regionalStudyBonus" BOOLEAN,
    "familySponsorship" BOOLEAN,
    "familySponsorshipStateLoc" TEXT,
    "residencyRequirement" TEXT,
    "offshoreCondition" TEXT,
    "sectorCritical" BOOLEAN,
    "financialCapacity" BOOLEAN,
    "financialCapacityValue" TEXT,
    "otherRequirement" TEXT,
    "offshore" BOOLEAN
);
INSERT INTO "new_EligibilityFactors" ("anzscoCode", "englishLevelRequired", "id", "occupationId", "pathway", "state", "studyInStateRequired", "visa", "workExperienceStateYears") SELECT "anzscoCode", "englishLevelRequired", "id", "occupationId", "pathway", "state", "studyInStateRequired", "visa", "workExperienceStateYears" FROM "EligibilityFactors";
DROP TABLE "EligibilityFactors";
ALTER TABLE "new_EligibilityFactors" RENAME TO "EligibilityFactors";
CREATE INDEX "EligibilityFactors_occupationId_visa_state_idx" ON "EligibilityFactors"("occupationId", "visa", "state");
CREATE TABLE "new_Occupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anzsco_code" TEXT NOT NULL,
    "skill_assessment_body" TEXT NOT NULL,
    "mltssl_flag" BOOLEAN NOT NULL,
    "stsol_flag" BOOLEAN NOT NULL,
    "rol_flag" BOOLEAN NOT NULL,
    "190" BOOLEAN NOT NULL DEFAULT false,
    "189 (PT)" BOOLEAN NOT NULL DEFAULT false,
    "491(S/T)" BOOLEAN NOT NULL DEFAULT false,
    "491 (F)" BOOLEAN NOT NULL DEFAULT false,
    "Skill_Level_Required" TEXT
);
INSERT INTO "new_Occupation" ("189 (PT)", "190", "491 (F)", "491(S/T)", "Skill_Level_Required", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag") SELECT "189 (PT)", "190", "491 (F)", "491(S/T)", "Skill_Level_Required", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag" FROM "Occupation";
DROP TABLE "Occupation";
ALTER TABLE "new_Occupation" RENAME TO "Occupation";
CREATE UNIQUE INDEX "Occupation_occupationId_key" ON "Occupation"("occupationId");
CREATE TABLE "new_Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "visaSubclass" TEXT NOT NULL DEFAULT '189',
    "age" INTEGER NOT NULL DEFAULT 0,
    "occupation" TEXT,
    "englishLevel" TEXT NOT NULL DEFAULT '',
    "workExperience_in" INTEGER NOT NULL DEFAULT 0,
    "workExperience_out" INTEGER NOT NULL DEFAULT 0,
    "nationality" TEXT NOT NULL DEFAULT '',
    "education_qualification" TEXT NOT NULL DEFAULT '',
    "study_requirement" TEXT NOT NULL DEFAULT '',
    "regional_study" TEXT NOT NULL DEFAULT '',
    "professional_year" TEXT NOT NULL DEFAULT '',
    "natti" TEXT NOT NULL DEFAULT '',
    "partner" TEXT NOT NULL DEFAULT '',
    "nomination_sponsorship" TEXT NOT NULL DEFAULT '',
    "specialistQualification" TEXT DEFAULT 'none',
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_occupation_fkey" FOREIGN KEY ("occupation") REFERENCES "Occupation" ("occupationId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("age", "createdAt", "education_qualification", "englishLevel", "id", "nationality", "natti", "nomination_sponsorship", "occupation", "partner", "professional_year", "regional_study", "score", "specialistQualification", "study_requirement", "updatedAt", "userId", "visaSubclass", "workExperience_in", "workExperience_out") SELECT "age", "createdAt", "education_qualification", "englishLevel", "id", "nationality", "natti", "nomination_sponsorship", "occupation", "partner", "professional_year", "regional_study", "score", "specialistQualification", "study_requirement", "updatedAt", "userId", "visaSubclass", "workExperience_in", "workExperience_out" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;