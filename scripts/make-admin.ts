import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function makeUserAdmin(userEmail: string) {
  try {
    // Update the user's role to admin
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, userEmail))
      .returning();

    if (result.length === 0) {
      console.log(`No user found with email: ${userEmail}`);
      return;
    }

    const updatedUser = result[0];
    console.log(`Successfully made user admin:`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log(`ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Usage: npm run make-admin <user-email>');
  console.error('Example: npm run make-admin john@example.com');
  process.exit(1);
}

makeUserAdmin(userEmail); 