import { z } from "zod";

export const boardNameSchema = z.string().trim().min(1, "이름을 입력해주세요.").max(80);

export const createBoardSchema = z.object({
  name: boardNameSchema,
});

export const updateBoardSchema = z.object({
  name: boardNameSchema.optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("올바른 이메일을 입력해주세요."),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
