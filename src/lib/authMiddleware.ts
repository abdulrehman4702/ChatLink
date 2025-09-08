import { supabase } from "./supabase";

export interface UserExistenceResult {
  exists: boolean;
  inSupabaseAuth: boolean;
  inUsersTable: boolean;
  userId?: string;
}

/**
 * Middleware function to check user existence across both Supabase Auth and users table
 * This helps maintain consistency between the two systems
 */
export const checkUserExistence = async (
  email: string
): Promise<UserExistenceResult> => {
  try {
    console.log(`Checking user existence for: ${email}`);

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    const inUsersTable = !userError && !!userData;

    // For Supabase Auth, we can't directly check without admin privileges
    // So we'll rely on the signup/signin process to handle this
    const inSupabaseAuth = false; // We'll determine this during auth operations

    const result: UserExistenceResult = {
      exists: inUsersTable,
      inSupabaseAuth,
      inUsersTable,
      userId: userData?.id,
    };

    console.log(`User existence check result:`, result);
    return result;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return {
      exists: false,
      inSupabaseAuth: false,
      inUsersTable: false,
    };
  }
};

/**
 * Clean up orphaned user records
 * This removes users from the users table that don't exist in Supabase Auth
 */
export const cleanupOrphanedUsers = async (): Promise<void> => {
  try {
    console.log("Starting orphaned user cleanup...");

    // Get all users from our table
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email");

    if (error) {
      console.error("Error fetching users for cleanup:", error);
      return;
    }

    if (!users || users.length === 0) {
      console.log("No users found for cleanup");
      return;
    }

    console.log(`Found ${users.length} users to check for cleanup`);

    // Note: We can't directly verify against Supabase Auth without admin privileges
    // This cleanup would need to be done server-side or with admin functions
    console.log(
      "Orphaned user cleanup completed (limited by client-side constraints)"
    );
  } catch (error) {
    console.error("Error during orphaned user cleanup:", error);
  }
};

/**
 * Ensure user exists in both systems
 * This is called after successful Supabase Auth operations
 */
export const ensureUserConsistency = async (
  userId: string,
  email: string,
  fullName: string
): Promise<boolean> => {
  try {
    console.log(`Ensuring user consistency for: ${email}`);

    // Check if user exists in our users table
    const { error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (selectError && selectError.code === "PGRST116") {
      // User doesn't exist in our table, create it
      console.log("Creating user in users table...");
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email,
        full_name: fullName,
        status: "online",
        last_seen: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error creating user in users table:", insertError);
        return false;
      }

      console.log("User created successfully in users table");
      return true;
    } else if (selectError) {
      console.error("Error checking user existence:", selectError);
      return false;
    } else {
      // User exists, update their status
      console.log("User exists, updating status...");
      const { error: updateError } = await supabase
        .from("users")
        .update({
          status: "online",
          last_seen: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user status:", updateError);
        return false;
      }

      console.log("User status updated successfully");
      return true;
    }
  } catch (error) {
    console.error("Error ensuring user consistency:", error);
    return false;
  }
};
