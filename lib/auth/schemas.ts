import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자를 넘을 수 없습니다.")
  .regex(/[A-Za-z]/, "영문자가 최소 1자 포함되어야 합니다.")
  .regex(/[0-9]/, "숫자가 최소 1자 포함되어야 합니다.");

export const signupSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  name: z.string().min(1).max(50),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
