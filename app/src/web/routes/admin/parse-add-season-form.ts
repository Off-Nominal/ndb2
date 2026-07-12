import { z } from "zod";

/** Parse a `datetime-local` value as UTC wall time (`YYYY-MM-DDTHH:mm` or with seconds). */
export function parseDatetimeLocalAsUtc(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Reject overflow (e.g. month 13) by round-tripping UTC parts.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  return date;
}

/** Format an ISO/Date instant for `datetime-local` (UTC wall time, minute precision). */
export function formatDatetimeLocalUtc(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const yyyy = String(date.getUTCFullYear()).padStart(4, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

const datetimeLocalUtcSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const date = parseDatetimeLocalAsUtc(value);
    if (!date) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid date and time.",
      });
      return z.NEVER;
    }
    return date;
  });

export const addSeasonFormSchema = z
  .object({
    name: z.string().trim().min(1, "Season name is required."),
    start: datetimeLocalUtcSchema,
    end: datetimeLocalUtcSchema,
    payout_formula: z.string().trim().min(1, "Payout formula is required."),
  })
  .refine((data) => data.start.getTime() < data.end.getTime(), {
    message: "Season start must be before end.",
    path: ["end"],
  });

export type AddSeasonForm = z.infer<typeof addSeasonFormSchema>;

export function parseAddSeasonForm(
  body: unknown,
): { ok: true; data: AddSeasonForm } | { ok: false; message: string } {
  const parsed = addSeasonFormSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      message: first?.message ?? "Check the season fields and try again.",
    };
  }
  return { ok: true, data: parsed.data };
}
