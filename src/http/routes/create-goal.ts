import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { createGoal } from '../../functions/create-goal'

const goalsSchema = {
  schema: {
    body: z.object({
      title: z.string(),
      desiredWeeklyFrequency: z.number().int().min(1).max(7),
    }),
  },
}

export const createGoalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/goals', goalsSchema, async (req) => {
    const { title, desiredWeeklyFrequency } = req.body
    await createGoal({
      title,
      desiredWeeklyFrequency,
    })
  })
}
