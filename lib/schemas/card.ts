import { z } from "zod";

export const cardTitleSchema = z.string().trim().min(1, "제목을 입력해주세요.").max(200);

export const createCardSchema = z.object({
  listId: z.string().min(1),
  title: cardTitleSchema,
});

export const updateCardSchema = z
  .object({
    title: cardTitleSchema.optional(),
    description: z.string().max(5000).nullable().optional(),
    listId: z.string().min(1).optional(),
    position: z.number().finite().optional(),
    dueDate: z
      .string()
      .datetime({ message: "ISO 날짜 형식이 아닙니다." })
      .nullable()
      .optional(),
    labelIds: z.array(z.string().min(1)).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "변경할 필드가 없습니다.",
  });

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
