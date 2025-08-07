import { db } from "../server/db";
import { assessmentQuestions } from "../shared/schema";

async function seedAssessmentQuestions() {
  try {
    console.log("Seeding assessment questions...");

    // Sample assessment questions for section 1 (Password & Authentication)
    const sampleQuestions = [
      {
        question: "What is the recommended minimum length for a strong password?",
        options: ["6 characters", "8 characters", "12 characters", "16 characters"],
        correctAnswer: "c", // 12 characters
        sectionId: 1,
        order: 1,
      },
      {
        question: "Which of the following is NOT a good password practice?",
        options: [
          "Using a mix of uppercase and lowercase letters",
          "Including numbers and special characters", 
          "Using your pet's name as your password",
          "Changing passwords regularly"
        ],
        correctAnswer: "c", // Using your pet's name
        sectionId: 1,
        order: 2,
      },
      {
        question: "What is two-factor authentication (2FA)?",
        options: [
          "Using two different passwords for the same account",
          "A security method that requires two forms of identification",
          "Having two email addresses for backup",
          "Using both a username and password"
        ],
        correctAnswer: "b", // A security method that requires two forms of identification
        sectionId: 1,
        order: 3,
      },
      {
        question: "Which authentication method is considered the most secure?",
        options: [
          "Password only",
          "SMS-based 2FA",
          "Authenticator app-based 2FA",
          "Email-based verification"
        ],
        correctAnswer: "c", // Authenticator app-based 2FA
        sectionId: 1,
        order: 4,
      },
      {
        question: "What should you do if you suspect your password has been compromised?",
        options: [
          "Wait and see if anything happens",
          "Change your password immediately",
          "Tell your friends about it",
          "Ignore it and hope for the best"
        ],
        correctAnswer: "b", // Change your password immediately
        sectionId: 1,
        order: 5,
      }
    ];

    // Insert the questions
    for (const question of sampleQuestions) {
      await db.insert(assessmentQuestions).values(question);
      console.log(`Added question: ${question.question}`);
    }

    console.log("Assessment questions seeded successfully!");
  } catch (error) {
    console.error("Error seeding assessment questions:", error);
  } finally {
    process.exit(0);
  }
}

seedAssessmentQuestions(); 