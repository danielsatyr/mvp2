-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "visaSubclass" TEXT NOT NULL DEFAULT '189',
    "age" INTEGER NOT NULL,
    "occupation" TEXT NOT NULL,
    "englishLevel" TEXT NOT NULL,
    "workExperience_in" INTEGER NOT NULL,
    "workExperience_out" INTEGER NOT NULL,
    "nationality" TEXT NOT NULL,
    "education_qualification" TEXT NOT NULL,
    "study_requirement" TEXT NOT NULL,
    "regional_study" TEXT NOT NULL,
    "professional_year" TEXT NOT NULL,
    "natti" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "nomination_sponsorship" TEXT NOT NULL,
    "specialistQualification" TEXT DEFAULT 'none',
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("age", "createdAt", "education_qualification", "englishLevel", "id", "nationality", "natti", "nomination_sponsorship", "occupation", "partner", "professional_year", "regional_study", "score", "specialistQualification", "study_requirement", "updatedAt", "userId", "visaSubclass", "workExperience_in", "workExperience_out") SELECT "age", "createdAt", "education_qualification", "englishLevel", "id", "nationality", "natti", "nomination_sponsorship", "occupation", "partner", "professional_year", "regional_study", "score", "specialistQualification", "study_requirement", "updatedAt", "userId", "visaSubclass", "workExperience_in", "workExperience_out" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
