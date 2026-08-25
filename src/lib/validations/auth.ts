import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function parseLoginInput(input: unknown): LoginInput {
  return loginSchema.parse(input);
}

export function safeParseLoginInput(input: unknown) {
  return loginSchema.safeParse(input);
}
