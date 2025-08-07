import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// TODO: Replace with Google OAuth
// import { setupAuth, isAuthenticated } from "./googleAuth";
import { 
  insertTrainingSectionSchema,
  insertTrainingModuleSchema, 
  insertModulePageSchema, 
  insertEmployeeProgressSchema,
  insertAssessmentQuestionSchema,
  insertAssessmentResultSchema 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // TODO: Setup Google OAuth
  // await setupAuth(app);

  // Auth routes
  // TODO: Add back isAuthenticated middleware after Google OAuth setup
  app.get('/api/auth/user', /* isAuthenticated, */ async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Training section routes
  app.get('/api/sections', isAuthenticated, async (req, res) => {
    try {
      const sections = await storage.getAllSections();
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  app.post('/api/sections', isAuthenticated, async (req, res) => {
    try {
      const sectionData = insertTrainingSectionSchema.parse(req.body);
      const section = await storage.createSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  app.put('/api/sections/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sectionData = insertTrainingSectionSchema.partial().parse(req.body);
      const section = await storage.updateSection(id, sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  app.delete('/api/sections/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  // Training module routes
  app.get('/api/modules', isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get('/api/sections/:sectionId/modules', isAuthenticated, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const modules = await storage.getModulesBySection(sectionId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules by section:", error);
      res.status(500).json({ message: "Failed to fetch modules by section" });
    }
  });

  app.get('/api/modules/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getModuleById(id);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post('/api/modules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleData = insertTrainingModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put('/api/modules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const moduleData = insertTrainingModuleSchema.partial().parse(req.body);
      const module = await storage.updateModule(id, moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete('/api/modules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteModule(id);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Module pages routes
  app.get('/api/modules/:id/pages', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const pages = await storage.getModulePages(moduleId);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching module pages:", error);
      res.status(500).json({ message: "Failed to fetch module pages" });
    }
  });

  app.post('/api/modules/:id/pages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      const pageData = insertModulePageSchema.parse({
        ...req.body,
        moduleId,
      });
      const page = await storage.createModulePage(pageData);
      res.json(page);
    } catch (error) {
      console.error("Error creating module page:", error);
      res.status(500).json({ message: "Failed to create module page" });
    }
  });

  app.put('/api/pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const pageData = insertModulePageSchema.partial().parse(req.body);
      const page = await storage.updateModulePage(id, pageData);
      res.json(page);
    } catch (error) {
      console.error("Error updating module page:", error);
      res.status(500).json({ message: "Failed to update module page" });
    }
  });

  app.delete('/api/pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteModulePage(id);
      res.json({ message: "Module page deleted successfully" });
    } catch (error) {
      console.error("Error deleting module page:", error);
      res.status(500).json({ message: "Failed to delete module page" });
    }
  });

  // Progress routes
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/progress/:moduleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleId = parseInt(req.params.moduleId);
      const progress = await storage.getModuleProgress(userId, moduleId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching module progress:", error);
      res.status(500).json({ message: "Failed to fetch module progress" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = insertEmployeeProgressSchema.parse({
        ...req.body,
        userId,
      });
      const progress = await storage.upsertProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Admin progress routes
  app.get('/api/admin/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allProgress = await storage.getAllUsersProgress();
      res.json(allProgress);
    } catch (error) {
      console.error("Error fetching all progress:", error);
      res.status(500).json({ message: "Failed to fetch all progress" });
    }
  });

  // Assessment routes
  app.get('/api/sections/:sectionId/assessment/questions', isAuthenticated, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const questions = await storage.getAssessmentQuestionsBySection(sectionId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching assessment questions by section:", error);
      res.status(500).json({ message: "Failed to fetch assessment questions by section" });
    }
  });

  app.post('/api/assessment/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const questionData = insertAssessmentQuestionSchema.parse(req.body);
      const question = await storage.createAssessmentQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating assessment question:", error);
      res.status(500).json({ message: "Failed to create assessment question" });
    }
  });

  app.put('/api/assessment/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const questionData = insertAssessmentQuestionSchema.partial().parse(req.body);
      const question = await storage.updateAssessmentQuestion(id, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating assessment question:", error);
      res.status(500).json({ message: "Failed to update assessment question" });
    }
  });

  app.delete('/api/assessment/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteAssessmentQuestion(id);
      res.json({ message: "Assessment question deleted successfully" });
    } catch (error) {
      console.error("Error deleting assessment question:", error);
      res.status(500).json({ message: "Failed to delete assessment question" });
    }
  });

  // Assessment result routes
  app.get('/api/assessment/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getUserAssessmentResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ message: "Failed to fetch assessment results" });
    }
  });

  app.post('/api/assessment/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sectionId, answers } = req.body;
      
      // Get the questions for this section to verify answers
      const questions = await storage.getAssessmentQuestionsBySection(sectionId);
      
      // Calculate the actual score by comparing answers
      let correctAnswers = 0;
      questions.forEach(question => {
        const userAnswer = answers[question.id.toString()];
        const correctAnswerIndex = question.correctAnswer;
        const correctAnswerText = question.options[correctAnswerIndex];
        
        // Check if user answer matches either the index or the text
        if (userAnswer === correctAnswerIndex.toString() || userAnswer === correctAnswerText) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= 100;
      
      const resultData = insertAssessmentResultSchema.parse({
        ...req.body,
        userId,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        passed,
      });
      
      const result = await storage.createAssessmentResult(resultData);
      res.json(result);
    } catch (error) {
      console.error("Error creating assessment result:", error);
      res.status(500).json({ message: "Failed to create assessment result" });
    }
  });

  // Certificate generation endpoint
  app.get('/api/certificate/:resultId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resultId = parseInt(req.params.resultId);
      
      // Get the assessment result
      const result = await storage.getAssessmentResult(resultId);
      if (!result || result.userId !== userId) {
        return res.status(404).json({ message: "Assessment result not found" });
      }
      
      if (!result.passed) {
        return res.status(400).json({ message: "Certificate only available for passed assessments" });
      }
      
      // Get user and section information
      const user = await storage.getUser(userId);
      const section = await storage.getSection(result.sectionId);
      
      if (!user || !section) {
        return res.status(404).json({ message: "User or section not found" });
      }
      
      // Generate the user's display name for the certificate
      let displayName = '';
      if (user.firstName || user.lastName) {
        displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      } else {
        // Use email if no first/last name is available
        displayName = user.email || 'Certificate Recipient';
      }
      
      // Generate certificate HTML
      const certificateHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Certificate of Completion</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f5f5f5; }
            .certificate { background: white; padding: 60px; margin: 0 auto; max-width: 800px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 30px; margin-bottom: 40px; }
            .title { font-size: 36px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .subtitle { font-size: 18px; color: #666; }
            .content { text-align: center; margin: 40px 0; }
            .recipient { font-size: 24px; margin: 20px 0; }
            .name { font-size: 32px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: inline-block; }
            .completion-text { font-size: 18px; margin: 30px 0; line-height: 1.6; }
            .course-name { font-size: 22px; font-weight: bold; color: #2563eb; margin: 20px 0; }
            .details { display: flex; justify-content: space-between; margin: 40px 0; }
            .detail-item { text-align: center; }
            .detail-label { font-size: 14px; color: #666; margin-bottom: 5px; }
            .detail-value { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e7eb; }
            .signature { font-size: 14px; color: #666; }
            @media print {
              body { background: white; }
              .certificate { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="title">Certificate of Completion</div>
              <div class="subtitle">Information Security Training</div>
            </div>
            
            <div class="content">
              <div class="recipient">This is to certify that</div>
              <div class="name">${displayName}</div>
              <div class="completion-text">
                has successfully completed the information security training course
              </div>
              <div class="course-name">${section.title}</div>
              
              <div class="details">
                <div class="detail-item">
                  <div class="detail-label">Score</div>
                  <div class="detail-value">${result.score}%</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Questions</div>
                  <div class="detail-value">${result.correctAnswers}/${result.totalQuestions}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Date Completed</div>
                  <div class="detail-value">${new Date(result.dateTaken).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="signature">
                SecureLearn Information Security Training Portal<br>
                Certificate ID: ${result.id}-${result.sectionId}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Mark certificate as generated
      await storage.updateAssessmentResult(resultId, { certificateGenerated: true });
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${section.title.replace(/[^a-zA-Z0-9]/g, '-')}.html"`);
      res.send(certificateHTML);
      
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  // Admin assessment results routes
  app.get('/api/admin/assessment/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allResults = await storage.getAllAssessmentResults();
      res.json(allResults);
    } catch (error) {
      console.error("Error fetching all assessment results:", error);
      res.status(500).json({ message: "Failed to fetch all assessment results" });
    }
  });

  // Reset assessment results for a user
  app.delete('/api/admin/assessment/results/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminUserId);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      await storage.deleteUserAssessmentResults(userId);
      res.json({ message: "Assessment results reset successfully" });
    } catch (error) {
      console.error("Error resetting assessment results:", error);
      res.status(500).json({ message: "Failed to reset assessment results" });
    }
  });

  // Section management routes
  app.post('/api/sections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sectionData = insertTrainingSectionSchema.parse(req.body);
      const section = await storage.createSection(sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  app.put('/api/sections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const sectionData = insertTrainingSectionSchema.partial().parse(req.body);
      const section = await storage.updateSection(id, sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  app.delete('/api/sections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSection(id);
      res.json({ message: "Section deleted successfully" });
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  // Module section assignment routes
  app.put('/api/modules/:id/section', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      const { sectionId } = req.body;
      
      const module = await storage.updateModule(moduleId, { sectionId });
      res.json(module);
    } catch (error) {
      console.error("Error updating module section:", error);
      res.status(500).json({ message: "Failed to update module section" });
    }
  });

  // File upload route
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // For now, just return the file path
      // In a real implementation, you would process PPT files here
      res.json({ 
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // PPT processing route
  app.post('/api/modules/process-ppt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { moduleId, uploadResult } = req.body;
      
      if (!moduleId || !uploadResult) {
        return res.status(400).json({ message: "Module ID and upload result required" });
      }

      // For demonstration, create sample pages from PPT
      // In a real implementation, you would:
      // 1. Use a library like pdf-poppler or similar to convert PPT to images
      // 2. Extract each slide as an image
      // 3. Create module pages for each slide
      
      const samplePages = [
        {
          moduleId: parseInt(moduleId),
          pageOrder: 1,
          pageType: 'ppt_slide',
          title: 'Introduction to Security',
          content: `/uploads/${uploadResult.filename}#slide1`
        },
        {
          moduleId: parseInt(moduleId),
          pageOrder: 2,
          pageType: 'ppt_slide',
          title: 'Common Threats',
          content: `/uploads/${uploadResult.filename}#slide2`
        },
        {
          moduleId: parseInt(moduleId),
          pageOrder: 3,
          pageType: 'ppt_slide',
          title: 'Best Practices',
          content: `/uploads/${uploadResult.filename}#slide3`
        }
      ];

      // Create the pages
      const createdPages = [];
      for (const pageData of samplePages) {
        const page = await storage.createModulePage(pageData);
        createdPages.push(page);
      }

      res.json({ 
        message: "PPT processed successfully",
        pages: createdPages,
        slideCount: samplePages.length
      });
    } catch (error) {
      console.error("Error processing PPT:", error);
      res.status(500).json({ message: "Failed to process PPT file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
