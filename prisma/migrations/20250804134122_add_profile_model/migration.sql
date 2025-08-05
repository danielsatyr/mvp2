-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
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
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
