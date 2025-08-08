import { z } from 'zod';
// Note: We deliberately avoid branded output here to keep schemas free of casts.

// ID schemas with brand-compatible output types
export const RoomIdSchema = z
  .string()
  .regex(/^room_[a-zA-Z0-9_-]{12,}$/, 'Invalid room ID format');

export const PlayerIdSchema = z
  .string()
  .regex(/^\d+$/, 'Invalid player ID');

export const AmountSchema = z
  .union([z.string(), z.number()])
  .transform((v): number => (typeof v === 'string' ? parseInt(v, 10) : v))
  .refine(v => Number.isFinite(v) && v > 0, { message: 'Invalid amount' });

// Query schemas for common actions
export const StartQuerySchema = z
  .object({
    roomId: z.string().optional(),
    r: z.string().optional(),
  })
  .transform((q): { roomId: string } => {
    const value = q.roomId ?? q.r;
    return { roomId: RoomIdSchema.parse(value) };
  });

export const JoinQuerySchema = z
  .object({
    roomId: z.string().optional(),
    r: z.string().optional(),
  })
  .transform((q): { roomId: string } => {
    const value = q.roomId ?? q.r;
    return { roomId: RoomIdSchema.parse(value) };
  });

export const RaiseQuerySchema = z
  .object({
    roomId: z.string(),
    amount: z.string().optional(),
  })
  .transform((q): { roomId: string; amount?: number } => {
    const roomId = RoomIdSchema.parse(q.roomId);
    const amount = q.amount !== undefined ? AmountSchema.parse(q.amount) : undefined;
    return { roomId, amount };
  });


