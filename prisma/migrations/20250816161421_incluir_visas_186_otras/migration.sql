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
    "190" BOOLEAN NOT NULL DEFAULT false,
    "189 (PT)" BOOLEAN NOT NULL DEFAULT false,
    "186" BOOLEAN NOT NULL DEFAULT false,
    "491(S/T)" BOOLEAN NOT NULL DEFAULT false,
    "491 (F)" BOOLEAN NOT NULL DEFAULT false,
    "494" BOOLEAN NOT NULL DEFAULT false,
    "482" BOOLEAN NOT NULL DEFAULT false,
    "407" BOOLEAN NOT NULL DEFAULT false,
    "485" BOOLEAN NOT NULL DEFAULT false,
    "Skill_Level_Required" TEXT
);
INSERT INTO "new_Occupation" ("189 (PT)", "190", "491 (F)", "491(S/T)", "Skill_Level_Required", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag") SELECT "189 (PT)", "190", "491 (F)", "491(S/T)", "Skill_Level_Required", "anzsco_code", "id", "mltssl_flag", "name", "occupationId", "rol_flag", "skill_assessment_body", "stsol_flag" FROM "Occupation";
DROP TABLE "Occupation";
ALTER TABLE "new_Occupation" RENAME TO "Occupation";
CREATE UNIQUE INDEX "Occupation_occupationId_key" ON "Occupation"("occupationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
