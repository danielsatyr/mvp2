/*
  Warnings:

  - You are about to drop the column `186` on the `Occupation` table. All the data in the column will be lost.
  - You are about to drop the column `190` on the `Occupation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Occupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anzsco_code" TEXT NOT NULL,
    "skill_assessment_body" TEXT NOT NULL,
    "mltssl_flag" BOOLEAN NOT NULL,
    "stsol_flag" BOOLEAN NOT NULL,
    "rol_flag" BOOLEAN NOT NULL,
    "189 (PT)" BOOLEAN NOT NULL,
    "491(S/T)" BOOLEAN NOT NULL,
    "491 (F)" BOOLEAN NOT NULL
);
INSERT INTO "new_Occupation" ("189 (PT)", "491 (F)", "491(S/T)", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag") SELECT "189 (PT)", "491 (F)", "491(S/T)", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag" FROM "Occupation";
DROP TABLE "Occupation";
ALTER TABLE "new_Occupation" RENAME TO "Occupation";
CREATE UNIQUE INDEX "Occupation_occupationId_key" ON "Occupation"("occupationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
