import { z } from "zod";

export const boardNameSchema = z.string().trim().min(1, "이름을 입력해주세요.").max(80);

export const createBoardSchema = z.object({
  name: boardNameSchema,
});

export const updateBoardSchema = z.object({
  name: boardNameSchema.optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
