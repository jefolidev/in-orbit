import dayjs from 'dayjs'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  // Retorna as metas cridas até a semana atual
  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      // Seleciona apenas os campos específicos
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      // Da tabela de objetivos/metas
      .from(goals)
      // Em que sejam menor que o último dia dessa semana
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

  // Retorna a quantidade de tasks concluídas
  const goalsCompletionCounts = db.$with('goal_completion_counts').as(
    db
      // Seleciona apenas os campos específicos
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
        // Quando se trbalha com uma Common Table Expression, é necessário dar um 'alias' para essa operação (count, sum, min)
      })
      // Da tabela dos objetivos completos
      .from(goalCompletions)
      .where(
        and(
          // Em que...
          gte(goalCompletions.createdAt, firstDayOfWeek), //  Os dias  seja maior que o primeiro dia da semana
          lte(goalCompletions.createdAt, lastDayOfWeek) // E menor que o último dia
        )
      )
      .groupBy(goalCompletions.goalId) // Agrupando pelo ID do objetivo
  )

  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalsCompletionCounts) // Retorna com base nesses registros
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      completionCount: sql/*sql*/ `
      COALESCE(${goalsCompletionCounts.completionCount}, 0)`.mapWith(Number),
    }) // Tudo que está retornando nos registros
    .from(goalsCreatedUpToWeek) // Retornando com informações em base nas metas criadas até a semana atual
    /* leftJoin - agrupa os elementos levando em consideração que os registros podem ser inexistente. Assim, o 
        Join continuará agrupando mesmo se estivesse vazio.
        Já, o innerJoin, caso o usuário n tenha feito nenhuma meta nenhuma vez, não retornaria nem a meta. */
    .leftJoin(
      goalsCompletionCounts, // Agrupa os elementos cujo a quantidade de metas
      eq(goalsCompletionCounts.goalId, goalsCreatedUpToWeek.id) // Seja igual às criadas essa semana
    )
  return { pendingGoals }
}
