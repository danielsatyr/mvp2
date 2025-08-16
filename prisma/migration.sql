-- CreateTable
CREATE TABLE "EligibilityFactor" (
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

-- CreateTable
CREATE TABLE "SkillLevel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" INTEGER NOT NULL,
    "minAQF" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EligibilityFactor_occupationId_visa_state_idx" ON "EligibilityFactor"("occupationId", "visa", "state");

-- CreateIndex
CREATE UNIQUE INDEX "SkillLevel_level_key" ON "SkillLevel"("level");
