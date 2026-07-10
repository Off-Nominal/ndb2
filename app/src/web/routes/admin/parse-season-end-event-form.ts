import { z } from "zod";
import { seasonIdSchema } from "@shared/validation/domain";

export const seasonEndEventFormSchema = z.object({
  season_id: seasonIdSchema,
});

export type SeasonEndEventForm = z.infer<typeof seasonEndEventFormSchema>;

export function parseSeasonEndEventForm(
  body: unknown,
):
  | { ok: true; data: SeasonEndEventForm }
  | { ok: false; message: string } {
  const parsed = seasonEndEventFormSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: "Choose a valid season." };
  }
  return { ok: true, data: parsed.data };
}
