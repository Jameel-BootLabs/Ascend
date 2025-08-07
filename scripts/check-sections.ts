import { db } from "../server/db";
import { trainingSections } from "../shared/schema";

async function checkAndCreateSections() {
  try {
    console.log("Checking existing sections...");
    
    const existingSections = await db.select().from(trainingSections);
    console.log(`Found ${existingSections.length} existing sections:`, existingSections);

    if (existingSections.length === 0) {
      console.log("No sections found. Creating default sections...");
      
      const defaultSections = [
        {
          title: "Password & Authentication",
          description: "Learn about strong passwords, two-factor authentication, and secure login practices.",
          order: 1,
        },
        {
          title: "Device Security", 
          description: "Protect your devices with proper security measures and best practices.",
          order: 2,
        },
        {
          title: "Email Security",
          description: "Identify phishing attempts and secure your email communications.",
          order: 3,
        },
        {
          title: "Malware Protection",
          description: "Understand malware threats and how to protect against them.",
          order: 4,
        },
        {
          title: "Data Privacy",
          description: "Learn about data protection, privacy laws, and secure data handling.",
          order: 5,
        },
        {
          title: "Incident Response",
          description: "Know what to do when security incidents occur.",
          order: 6,
        }
      ];

      for (const section of defaultSections) {
        await db.insert(trainingSections).values(section);
        console.log(`Created section: ${section.title}`);
      }
      
      console.log("Default sections created successfully!");
    } else {
      console.log("Sections already exist. No action needed.");
    }
  } catch (error) {
    console.error("Error checking/creating sections:", error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateSections(); 