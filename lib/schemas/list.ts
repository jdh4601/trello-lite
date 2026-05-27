import { z } from "zod";

export const listNameSchema = z.string().trim().min(1, "이름을 입력해주세요.").max(60);

export const createListSchema = z.object({
  boardId: z.string().min(1),
  name: listNameSchema,
});

export const updateListSchema = z
  .object({
    name: listNameSchema.optional(),
    position: z.number().finite().optional(),
  })
  .refine((v) => v.name !== undefined || v.position !== undefined, {
    message: "변경할 필드가 없습니다.",
  });

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
