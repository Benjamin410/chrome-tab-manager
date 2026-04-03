import { z } from "zod";

export const TabManagerVideoSchema = z.object({
  voiceoverFiles: z.array(z.string()).default([]),
});

export type TabManagerVideoProps = z.infer<typeof TabManagerVideoSchema>;
