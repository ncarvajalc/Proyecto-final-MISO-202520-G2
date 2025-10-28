import { z } from "zod";

export const optionalUrlField = (message: string) =>
  z
    .string()
    .url({ message })
    .optional()
    .or(z.literal(""));
