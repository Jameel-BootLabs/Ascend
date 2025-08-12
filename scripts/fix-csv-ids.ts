import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

async function fixCSVIds(csvFilePath: string) {
  try {
    console.log("Fixing CSV IDs and section_ids...");
    
    // Read and parse CSV file
    const csvContent = readFileSync(csvFilePath, 'utf-8');
    const questions = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${questions.length} questions in CSV`);

    // Transform the data
    const fixedQuestions = questions.map((question: any, index: number) => ({
      ...question,
      id: (index + 1).toString(), // Start from 1
      section_id: '1' // Set all section_ids to 1
    }));

    // Convert back to CSV
    const fixedCsvContent = stringify(fixedQuestions, {
      header: true,
      columns: Object.keys(fixedQuestions[0])
    });

    // Write the fixed CSV
    const outputPath = csvFilePath.replace('.csv', '_fixed.csv');
    writeFileSync(outputPath, fixedCsvContent);
    
    console.log(`✓ Fixed CSV saved to: ${outputPath}`);
    console.log(`✓ Changed ${questions.length} IDs from 51-95 to 1-${questions.length}`);
    console.log(`✓ Set all section_ids to 1`);
    
    // Show sample of first few rows
    console.log('\nSample of fixed data:');
    fixedQuestions.slice(0, 3).forEach((q: any) => {
      console.log(`ID: ${q.id}, Section: ${q.section_id}, Question: ${q.question.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error("Error fixing CSV:", error);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Usage: npm run fix-csv <csv-file-path>');
  console.error('Example: npm run fix-csv ./assessment_questions.csv');
  process.exit(1);
}

fixCSVIds(csvFilePath); 