import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().nullable().optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
