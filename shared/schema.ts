import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["employee", "admin"] }).default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training sections table
export const trainingSections = pgTable("training_sections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training modules table
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => trainingSections.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Module pages table
export const modulePages = pgTable("module_pages", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => trainingModules.id).notNull(),
  pageOrder: integer("page_order").notNull(),
  pageType: varchar("page_type", { enum: ["text", "image", "video", "ppt_slide"] }).default("text"),
  title: varchar("title", { length: 255 }),
  content: text("content"), // Rich text, URL, or JSON content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee progress table
export const employeeProgress = pgTable("employee_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  moduleId: integer("module_id").references(() => trainingModules.id).notNull(),
  status: varchar("status", { enum: ["not_started", "in_progress", "completed"] }).default("not_started"),
  lastViewedPageId: integer("last_viewed_page_id").references(() => modulePages.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Add unique constraint for userId and moduleId combination
  userModuleUnique: unique("user_module_unique").on(table.userId, table.moduleId),
}));

// Assessment questions table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of options
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(), // a, b, c, d
  moduleId: integer("module_id").references(() => trainingModules.id),
  sectionId: integer("section_id").references(() => trainingSections.id),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assessment results table
export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  moduleId: integer("module_id").references(() => trainingModules.id),
  sectionId: integer("section_id").references(() => trainingSections.id),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  answers: jsonb("answers").notNull(), // User's answers
  passed: boolean("passed").default(false),
  dateTaken: timestamp("date_taken").defaultNow(),
  certificateGenerated: boolean("certificate_generated").default(false),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(employeeProgress),
  assessmentResults: many(assessmentResults),
}));

export const trainingSectionsRelations = relations(trainingSections, ({ many }) => ({
  modules: many(trainingModules),
  assessmentQuestions: many(assessmentQuestions),
  assessmentResults: many(assessmentResults),
}));

export const trainingModulesRelations = relations(trainingModules, ({ one, many }) => ({
  section: one(trainingSections, {
    fields: [trainingModules.sectionId],
    references: [trainingSections.id],
  }),
  pages: many(modulePages),
  progress: many(employeeProgress),
  questions: many(assessmentQuestions),
}));

export const modulePagesRelations = relations(modulePages, ({ one }) => ({
  module: one(trainingModules, {
    fields: [modulePages.moduleId],
    references: [trainingModules.id],
  }),
}));

export const employeeProgressRelations = relations(employeeProgress, ({ one }) => ({
  user: one(users, {
    fields: [employeeProgress.userId],
    references: [users.id],
  }),
  module: one(trainingModules, {
    fields: [employeeProgress.moduleId],
    references: [trainingModules.id],
  }),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  user: one(users, {
    fields: [assessmentResults.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertTrainingSectionSchema = createInsertSchema(trainingSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertModulePageSchema = createInsertSchema(modulePages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEmployeeProgressSchema = createInsertSchema(employeeProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  completedAt: z.union([z.string().datetime(), z.date(), z.null()]).optional().transform(val => {
    if (!val || val === null) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});
export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
  createdAt: true,
});
export const insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  dateTaken: true,
}).extend({
  score: z.union([z.number(), z.string()]).transform(val => val.toString()),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type TrainingSection = typeof trainingSections.$inferSelect;
export type InsertTrainingSection = z.infer<typeof insertTrainingSectionSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type ModulePage = typeof modulePages.$inferSelect;
export type InsertModulePage = z.infer<typeof insertModulePageSchema>;
export type EmployeeProgress = typeof employeeProgress.$inferSelect;
export type InsertEmployeeProgress = z.infer<typeof insertEmployeeProgressSchema>;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
