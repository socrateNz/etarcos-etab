/**
 * Architecture modulaire Etarcos Etab.
 *
 * Chaque module métier vit dans `src/features/<module>/` :
 * - types.ts      → types du domaine
 * - schemas.ts    → validations Zod
 * - components/   → UI spécifique au module
 * - hooks/        → hooks métier
 * - services/     → accès données
 * - actions.ts    → Server Actions (Phase 2)
 */
export * from "./_shared";
export * as tracksFeature from "./tracks";
export * as establishmentsFeature from "./establishments";
export * as cyclesFeature from "./cycles";
export * as subjectsFeature from "./subjects";
export * as classroomsFeature from "./classrooms";
export * as staffFeature from "./staff";
export * as studentsFeature from "./students";
export * as parentsFeature from "./parents";
export * as roomsFeature from "./rooms";
export * as timetablesFeature from "./timetables";
export * as examsFeature from "./exams";
export * as gradesFeature from "./grades";
export * as attendanceFeature from "./attendance";
export * as paymentsFeature from "./payments";
export * as expensesFeature from "./expenses";
export * as disciplineFeature from "./discipline";
export * as libraryFeature from "./library";
export * as inventoryFeature from "./inventory";
export * as newsFeature from "./news";



