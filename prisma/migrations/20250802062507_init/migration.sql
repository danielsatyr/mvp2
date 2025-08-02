-- CreateTable
CREATE TABLE "Occupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anzsco_code" TEXT NOT NULL,
    "skill_assessment_body" TEXT NOT NULL,
    "mltssl_flag" BOOLEAN NOT NULL,
    "stsol_flag" BOOLEAN NOT NULL,
    "rol_flag" BOOLEAN NOT NULL,
    "190" BOOLEAN NOT NULL,
    "189 (PT)" BOOLEAN NOT NULL,
    "186" BOOLEAN NOT NULL,
    "491(S/T)" BOOLEAN NOT NULL,
    "491 (F)" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Occupation_occupationId_key" ON "Occupation"("occupationId");
