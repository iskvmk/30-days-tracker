package com.example.tracker.repository

import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.util.UUID

@Component
class DemoDataSeeder(private val jpa: TaskJpaRepository) : CommandLineRunner {
    override fun run(vararg args: String?) {
        if (jpa.count() > 0) return
        seedDemoTasks()
    }

    private fun seedDemoTasks() {
        val today = LocalDate.now()
        val monthStart = today.withDayOfMonth(1)
        val toSave = mutableListOf<TaskEntity>()

        repeat(4) { day ->
            val date = monthStart.plusDays(day.toLong()).toString()
            toSave += TaskEntity(
                id = UUID.randomUUID().toString(),
                title = "Daily planning",
                notes = "5-minute schedule review",
                date = date,
                completed = day % 3 != 0,
                recurring = "daily"
            )
            toSave += TaskEntity(
                id = UUID.randomUUID().toString(),
                title = "Ship feature work",
                notes = "Coding sprint",
                date = date,
                completed = day % 2 == 0,
                recurring = "daily"
            )
        }
        val weekend = monthStart.plusDays(6).toString()
        toSave += TaskEntity(
            id = UUID.randomUUID().toString(),
            title = "Long run",
            notes = "8km endurance",
            date = weekend,
            completed = false,
            recurring = null
        )

        jpa.saveAll(toSave)
    }
}
