import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { createGoalCompletion } from '../../functions/create-goal-completion'

const completionSchema = {
  schema: {
    body: z.object({
      goalId: z.string(),
    }),
  },
}

export const createCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/completions', completionSchema, async (req) => {
    const { goalId } = req.body

    await createGoalCompletion({ goalId })
  })
}
