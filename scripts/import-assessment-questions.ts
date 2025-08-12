import { db } from "../server/db";
import { assessmentQuestions } from "../shared/schema";
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

interface CSVQuestion {
  id: string;
  question: string;
  options: string;
  correct_answer: string;
  module_id?: string;
  section_id?: string;
  order: string;
  created_at?: string;
}

async function importAssessmentQuestions(csvFilePath: string, resetSequence: boolean = false, useExistingIds: boolean = false) {
  try {
    console.log("Importing assessment questions from CSV...");
    
    // Read and parse CSV file
    const csvContent = readFileSync(csvFilePath, 'utf-8');
    const questions: CSVQuestion[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${questions.length} questions in CSV`);
    
    // Debug: Show the first question to see column structure
    if (questions.length > 0) {
      console.log("\nFirst question structure:");
      console.log("Columns:", Object.keys(questions[0]));
      console.log("Sample data:", questions[0]);
    }

    // If resetSequence is true, reset the ID sequence to start from 51
    if (resetSequence) {
      console.log("Resetting ID sequence to start from 51...");
      await db.execute(`ALTER SEQUENCE assessment_questions_id_seq RESTART WITH 51`);
      console.log("Sequence reset successfully");
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const csvQuestion of questions) {
      try {
        // Check if required fields exist
        if (!csvQuestion.question || !csvQuestion.options || !csvQuestion.correct_answer) {
          console.error(`✗ Missing required fields for question ${csvQuestion.id}:`, {
            question: !!csvQuestion.question,
            options: !!csvQuestion.options,
            correct_answer: !!csvQuestion.correct_answer
          });
          skippedCount++;
          continue;
        }

        // Parse options - handle both JSON format and comma-separated
        let options: string[];
        try {
          // Try to parse as JSON first
          options = JSON.parse(csvQuestion.options);
        } catch {
          // Fall back to comma-separated
          options = csvQuestion.options.split(',').map(opt => opt.trim());
        }
        
        // Prepare question data
        const questionData = {
          question: csvQuestion.question,
          options: options,
          correctAnswer: csvQuestion.correct_answer.toLowerCase(),
          moduleId: useExistingIds ? 1 : (csvQuestion.module_id ? parseInt(csvQuestion.module_id) : null),
          sectionId: useExistingIds ? 1 : (csvQuestion.section_id ? parseInt(csvQuestion.section_id) : null),
          order: parseInt(csvQuestion.order) || 1,
        };

        // Insert question
        await db.insert(assessmentQuestions).values(questionData);
        insertedCount++;
        console.log(`✓ Inserted question ${csvQuestion.id}: ${csvQuestion.question.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`✗ Error inserting question ${csvQuestion.id}:`, error);
        skippedCount++;
      }
    }

    console.log(`\nImport completed!`);
    console.log(`✓ Successfully inserted: ${insertedCount} questions`);
    if (skippedCount > 0) {
      console.log(`✗ Skipped: ${skippedCount} questions due to errors`);
    }

  } catch (error) {
    console.error("Error importing assessment questions:", error);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const csvFilePath = process.argv[2];
const resetSequence = process.argv.includes('--reset-sequence');
const useExistingIds = process.argv.includes('--use-existing-ids');

if (!csvFilePath) {
  console.error('Usage: npm run import-questions <csv-file-path> [--reset-sequence] [--use-existing-ids]');
  console.error('Example: npm run import-questions ./questions.csv --reset-sequence --use-existing-ids');
  console.error('\nCSV format should have columns: id,question,options,correct_answer,module_id,section_id,order');
  console.error('Options can be JSON array or comma-separated values');
  console.error('Use --reset-sequence flag to reset ID sequence to start from 51');
  console.error('Use --use-existing-ids flag to map all questions to section_id=1 and module_id=1');
  process.exit(1);
}

importAssessmentQuestions(csvFilePath, resetSequence, useExistingIds); 