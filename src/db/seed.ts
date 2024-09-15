import dayjs from 'dayjs'
import { client, db } from './index'
import { goalCompletions, goals } from './schema'

async function seed() {
  await db.delete(goalCompletions)
  await db.delete(goals)

  const result = await db
    .insert(goals)
    .values([
      { title: 'Arrumar a cama', desiredWeeklyFrequency: 5 },
      { title: 'Colocar ração pros gatos', desiredWeeklyFrequency: 4 },
      { title: 'Treinar', desiredWeeklyFrequency: 7 },
    ])
    .returning()

  const startOfWeek = dayjs().startOf('week')

  await db.insert(goalCompletions).values([
    { goalId: result[0].id, createdAt: startOfWeek.toDate() },
    { goalId: result[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
  ])
}

seed().finally(() => {
  client.end()
})
