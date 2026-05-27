import { z } from "zod";

export const labelNameSchema = z.string().trim().min(1).max(40);
// 6-digit hex color (with leading #).
export const labelColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "유효한 색상 코드(#RRGGBB)가 아닙니다.");

export const createLabelSchema = z.object({
  name: labelNameSchema,
  color: labelColorSchema,
});

export const updateLabelSchema = z
  .object({
    name: labelNameSchema.optional(),
    color: labelColorSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "변경할 필드가 없습니다.",
  });

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

/** Default palette for the swatch picker. */
export const LABEL_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;
