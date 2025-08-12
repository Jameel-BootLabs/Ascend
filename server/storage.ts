import {
  users,
  trainingSections,
  trainingModules,
  modulePages,
  employeeProgress,
  assessmentQuestions,
  assessmentResults,
  type User,
  type UpsertUser,
  type TrainingSection,
  type InsertTrainingSection,
  type TrainingModule,
  type InsertTrainingModule,
  type ModulePage,
  type InsertModulePage,
  type EmployeeProgress,
  type InsertEmployeeProgress,
  type AssessmentQuestion,
  type InsertAssessmentQuestion,
  type AssessmentResult,
  type InsertAssessmentResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Training section operations
  getAllSections(): Promise<TrainingSection[]>;
  getSectionById(id: number): Promise<TrainingSection | undefined>;
  createSection(section: InsertTrainingSection): Promise<TrainingSection>;
  updateSection(id: number, section: Partial<InsertTrainingSection>): Promise<TrainingSection>;
  deleteSection(id: number): Promise<void>;
  
  // Training module operations
  getAllModules(): Promise<TrainingModule[]>;
  getModulesBySection(sectionId: number): Promise<TrainingModule[]>;
  getModuleById(id: number): Promise<TrainingModule | undefined>;
  createModule(module: InsertTrainingModule): Promise<TrainingModule>;
  updateModule(id: number, module: Partial<InsertTrainingModule>): Promise<TrainingModule>;
  deleteModule(id: number): Promise<void>;
  
  // Module page operations
  getModulePages(moduleId: number): Promise<ModulePage[]>;
  createModulePage(page: InsertModulePage): Promise<ModulePage>;
  updateModulePage(id: number, page: Partial<InsertModulePage>): Promise<ModulePage>;
  deleteModulePage(id: number): Promise<void>;
  
  // Employee progress operations
  getUserProgress(userId: string): Promise<EmployeeProgress[]>;
  getModuleProgress(userId: string, moduleId: number): Promise<EmployeeProgress | undefined>;
  upsertProgress(progress: InsertEmployeeProgress): Promise<EmployeeProgress>;
  getAllUsersProgress(): Promise<(EmployeeProgress & { user: User; module: TrainingModule })[]>;
  
  // Assessment operations
  getAssessmentQuestionsBySection(sectionId: number): Promise<AssessmentQuestion[]>;
  getAllAssessmentQuestions(): Promise<AssessmentQuestion[]>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  updateAssessmentQuestion(id: number, question: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion>;
  deleteAssessmentQuestion(id: number): Promise<void>;
  
  // Assessment result operations
  getUserAssessmentResults(userId: string): Promise<AssessmentResult[]>;
  createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult>;
  getAllAssessmentResults(): Promise<(AssessmentResult & { user: User; moduleId?: number; sectionId?: number })[]>;
  deleteAssessmentResult(id: number): Promise<void>;
  deleteUserAssessmentResults(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Training section operations
  async getAllSections(): Promise<TrainingSection[]> {
    return await db.select().from(trainingSections).orderBy(asc(trainingSections.order));
  }

  async getSectionById(id: number): Promise<TrainingSection | undefined> {
    const [section] = await db.select().from(trainingSections).where(eq(trainingSections.id, id));
    return section;
  }

  async createSection(section: InsertTrainingSection): Promise<TrainingSection> {
    const [created] = await db.insert(trainingSections).values(section).returning();
    return created;
  }

  async updateSection(id: number, section: Partial<InsertTrainingSection>): Promise<TrainingSection> {
    const [updated] = await db
      .update(trainingSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(trainingSections.id, id))
      .returning();
    return updated;
  }

  async deleteSection(id: number): Promise<void> {
    // Delete associated modules and their data first
    const modulesInSection = await db.select().from(trainingModules).where(eq(trainingModules.sectionId, id));
    
    for (const module of modulesInSection) {
      await this.deleteModule(module.id);
    }
    
    // Delete section assessment questions
    await db.delete(assessmentQuestions).where(eq(assessmentQuestions.sectionId, id));
    
    // Delete section assessment results
    await db.delete(assessmentResults).where(eq(assessmentResults.sectionId, id));
    
    // Delete the section
    await db.delete(trainingSections).where(eq(trainingSections.id, id));
  }

  async getSection(id: number): Promise<TrainingSection | undefined> {
    const [section] = await db
      .select()
      .from(trainingSections)
      .where(eq(trainingSections.id, id));
    return section;
  }

  // Training module operations
  async getAllModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules).orderBy(asc(trainingModules.order));
  }

  async getModulesBySection(sectionId: number): Promise<TrainingModule[]> {
    return await db
      .select()
      .from(trainingModules)
      .where(eq(trainingModules.sectionId, sectionId))
      .orderBy(asc(trainingModules.order));
  }

  async getModuleById(id: number): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return module;
  }

  async createModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const [created] = await db.insert(trainingModules).values(module).returning();
    return created;
  }

  async updateModule(id: number, module: Partial<InsertTrainingModule>): Promise<TrainingModule> {
    const [updated] = await db
      .update(trainingModules)
      .set({ ...module, updatedAt: new Date() })
      .where(eq(trainingModules.id, id))
      .returning();
    return updated;
  }

  async deleteModule(id: number): Promise<void> {
    // Delete associated progress records first
    await db.delete(employeeProgress).where(eq(employeeProgress.moduleId, id));
    // Delete associated pages
    await db.delete(modulePages).where(eq(modulePages.moduleId, id));
    // Delete the module
    await db.delete(trainingModules).where(eq(trainingModules.id, id));
  }

  // Module page operations
  async getModulePages(moduleId: number): Promise<ModulePage[]> {
    return await db
      .select()
      .from(modulePages)
      .where(eq(modulePages.moduleId, moduleId))
      .orderBy(asc(modulePages.pageOrder));
  }

  async createModulePage(page: InsertModulePage): Promise<ModulePage> {
    const [created] = await db.insert(modulePages).values(page).returning();
    return created;
  }

  async updateModulePage(id: number, page: Partial<InsertModulePage>): Promise<ModulePage> {
    const [updated] = await db
      .update(modulePages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(modulePages.id, id))
      .returning();
    return updated;
  }

  async deleteModulePage(id: number): Promise<void> {
    await db.delete(modulePages).where(eq(modulePages.id, id));
  }

  // Employee progress operations
  async getUserProgress(userId: string): Promise<EmployeeProgress[]> {
    return await db
      .select()
      .from(employeeProgress)
      .where(eq(employeeProgress.userId, userId));
  }

  async getModuleProgress(userId: string, moduleId: number): Promise<EmployeeProgress | undefined> {
    const [progress] = await db
      .select()
      .from(employeeProgress)
      .where(and(eq(employeeProgress.userId, userId), eq(employeeProgress.moduleId, moduleId)));
    return progress;
  }

  async upsertProgress(progress: InsertEmployeeProgress): Promise<EmployeeProgress> {
    const [upserted] = await db
      .insert(employeeProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [employeeProgress.userId, employeeProgress.moduleId],
        set: {
          status: progress.status,
          lastViewedPageId: progress.lastViewedPageId,
          completedAt: progress.completedAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getAllUsersProgress(): Promise<(EmployeeProgress & { user: User; module: TrainingModule })[]> {
    const results = await db
      .select({
        id: employeeProgress.id,
        userId: employeeProgress.userId,
        moduleId: employeeProgress.moduleId,
        status: employeeProgress.status,
        lastViewedPageId: employeeProgress.lastViewedPageId,
        completedAt: employeeProgress.completedAt,
        createdAt: employeeProgress.createdAt,
        updatedAt: employeeProgress.updatedAt,
        user: users,
        module: trainingModules,
      })
      .from(employeeProgress)
      .leftJoin(users, eq(employeeProgress.userId, users.id))
      .leftJoin(trainingModules, eq(employeeProgress.moduleId, trainingModules.id));
    
    return results.filter(r => r.user && r.module) as (EmployeeProgress & { user: User; module: TrainingModule })[];
  }

  // Assessment operations
  async getAssessmentQuestionsBySection(sectionId: number): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.sectionId, sectionId))
      .orderBy(asc(assessmentQuestions.order));
  }

  async getAllAssessmentQuestions(): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .orderBy(asc(assessmentQuestions.sectionId), asc(assessmentQuestions.order));
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [created] = await db.insert(assessmentQuestions).values(question).returning();
    return created;
  }

  async updateAssessmentQuestion(id: number, question: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion> {
    const [updated] = await db
      .update(assessmentQuestions)
      .set(question)
      .where(eq(assessmentQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteAssessmentQuestion(id: number): Promise<void> {
    await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, id));
  }

  // Assessment result operations
  async getUserAssessmentResults(userId: string): Promise<AssessmentResult[]> {
    return await db
      .select()
      .from(assessmentResults)
      .where(eq(assessmentResults.userId, userId))
      .orderBy(desc(assessmentResults.dateTaken));
  }

  async createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult> {
    const [created] = await db.insert(assessmentResults).values(result).returning();
    return created;
  }

  async getAssessmentResult(id: number): Promise<AssessmentResult | undefined> {
    const [result] = await db
      .select()
      .from(assessmentResults)
      .where(eq(assessmentResults.id, id));
    return result;
  }

  async updateAssessmentResult(id: number, updates: Partial<InsertAssessmentResult>): Promise<AssessmentResult> {
    const [updated] = await db
      .update(assessmentResults)
      .set(updates)
      .where(eq(assessmentResults.id, id))
      .returning();
    return updated;
  }

  async deleteAssessmentResult(id: number): Promise<void> {
    await db.delete(assessmentResults).where(eq(assessmentResults.id, id));
  }

  async deleteUserAssessmentResults(userId: string): Promise<void> {
    await db.delete(assessmentResults).where(eq(assessmentResults.userId, userId));
  }

  async getAllAssessmentResults(): Promise<(AssessmentResult & { user: User; moduleId?: number; sectionId?: number })[]> {
    const results = await db
      .select({
        id: assessmentResults.id,
        userId: assessmentResults.userId,
        moduleId: assessmentResults.moduleId,
        sectionId: assessmentResults.sectionId,
        score: assessmentResults.score,
        totalQuestions: assessmentResults.totalQuestions,
        correctAnswers: assessmentResults.correctAnswers,
        answers: assessmentResults.answers,
        passed: assessmentResults.passed,
        dateTaken: assessmentResults.dateTaken,
        certificateGenerated: assessmentResults.certificateGenerated,
        user: users,
      })
      .from(assessmentResults)
      .leftJoin(users, eq(assessmentResults.userId, users.id))
      .orderBy(desc(assessmentResults.dateTaken));
    
    return results.filter(r => r.user).map(r => ({
      ...r,
      sectionId: r.sectionId || undefined
    })) as (AssessmentResult & { user: User; moduleId?: number; sectionId?: number })[];
  }
}

export const storage = new DatabaseStorage();
