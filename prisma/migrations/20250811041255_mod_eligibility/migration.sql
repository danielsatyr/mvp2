/*
  Warnings:

  - You are about to drop the `EligibilityFactor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EligibilityFactor";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "EligibilityFactors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" TEXT NOT NULL,
    "anzscoCode" TEXT,
    "visa" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pathway" TEXT,
    "englishLevelRequired" TEXT,
    "workExperienceStateYears" INTEGER,
    "studyInStateRequired" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EligibilityFactors_occupationId_visa_state_idx" ON "EligibilityFactors"("occupationId", "visa", "state");
