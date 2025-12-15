
'use server';

import { z } from 'zod';

// --- Login ---
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password cannot be empty." }), // Password validation for login
});

interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginUser(values: z.infer<typeof LoginSchema>): Promise<LoginResult> {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    // Construct a more specific error message if possible
    const firstError = validatedFields.error.flatten().fieldErrors;
    const emailError = firstError.email?.[0];
    const passwordError = firstError.password?.[0];
    let errorMessage = "Invalid fields provided.";
    if (emailError && passwordError) {
      errorMessage = `Email: ${emailError} Password: ${passwordError}`;
    } else if (emailError) {
      errorMessage = emailError;
    } else if (passwordError) {
      errorMessage = passwordError;
    }
    return { success: false, error: errorMessage };
  }

  const { email, password } = validatedFields.data;

  // Placeholder logic (REMOVE THIS IN PRODUCTION):

  // 1. Check for the hardcoded demo user
  if (email === "student@example.com" && password === "password123") {
    console.log("Simulated successful login for demo user:", email);
    // In a real app, you'd set up a session here (e.g., using cookies, JWT, or NextAuth.js)
    return { success: true };
  }

  // 2. For any other email, if it's not the demo user,
  //    simulate a successful login. This allows users who "register"
  //    to then "log in" for demo purposes.
  //    A real app would query the database and verify the hashed password.
  if (email !== "student@example.com") {
    // The password's non-emptiness is already confirmed by LoginSchema.
    // We assume any other valid email/password combo is a "registered" user for this demo.
    console.log("Simulated successful login for a 'newly registered' user (demo):", email);
    return { success: true };
  }

  // 3. If it IS the demo user email but the password was wrong
  if (email === "student@example.com" && password !== "password123") {
    return { success: false, error: "Invalid password for student@example.com." };
  }
  
  // Fallback, though the logic above should cover typical cases.
  return { success: false, error: "Login failed. Please check your credentials. (Demo: Use student@example.com / password123 or register a new account)" };
}


// --- Registration ---
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerUser(values: z.infer<typeof RegisterSchema>): Promise<RegisterResult> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { success: false, error: firstError || "Invalid registration data." };
  }

  const { email, password } = validatedFields.data;

  // TODO: Replace with actual database interaction
  // 1. Check if user with this email already exists in your database.
  //    Example: const existingUser = await db.user.findUnique({ where: { email } });
  // 2. If user exists, return { success: false, error: "Email already in use." }
  // 3. Securely hash the password before storing it. Use a library like bcrypt.
  //    Example: const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds
  // 4. Create new user in your database with the email and hashedPassword.
  //    Example: await db.user.create({ data: { email, passwordHash: hashedPassword } });

  // Placeholder logic (REMOVE THIS IN PRODUCTION):
  // This simulates checking for an existing user and adding a new one.
  // In a real app, this state would be in your database.
  
  // For demo, prevent registering with the hardcoded demo user's email
  if (email === "student@example.com") {
    return { success: false, error: "This email is reserved for the demo user. Please use a different email to register." };
  }

  console.log(`Simulated registration for ${email}. In a real app, this user would be added to a database.`);
  return { success: true };
}
