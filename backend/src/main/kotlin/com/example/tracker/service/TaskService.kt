package com.example.tracker.service

import com.example.tracker.model.DayStatus
import com.example.tracker.model.DaySummary
import com.example.tracker.model.MonthSummary
import com.example.tracker.model.Stats
import com.example.tracker.model.Task
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

@Service
class TaskService {
    private val tasks: MutableList<Task> = mutableListOf()

    init {
        seedDemoTasks()
    }

    fun listMonth(year: Int, month: Int): MonthSummary {
        val yearMonth = YearMonth.of(year, month)
        val days = (1..yearMonth.lengthOfMonth()).map { day ->
            val date = LocalDate.of(year, month, day)
            val dateKey = date.toString()
            val dayTasks = tasks.filter { it.date == dateKey }
            DaySummary(
                date = dateKey,
                status = evaluateStatus(dayTasks),
                tasks = dayTasks
            )
        }

        val stats = calculateStats(days)
        return MonthSummary(year = year, month = month, days = days, stats = stats)
    }

    fun toggleTask(taskId: String): Task? {
        val idx = tasks.indexOfFirst { it.id == taskId }
        if (idx == -1) return null
        val current = tasks[idx]
        val today = LocalDate.now()
        if (LocalDate.parse(current.date).isBefore(today)) {
            return current // locked
        }
        val updated = current.copy(completed = !current.completed)
        tasks[idx] = updated
        return updated
    }

    fun addTask(task: Task): Task {
        val newTask = task.copy(id = UUID.randomUUID().toString())
        tasks += newTask
        return newTask
    }

    private fun evaluateStatus(dayTasks: List<Task>): DayStatus {
        if (dayTasks.isEmpty()) return DayStatus.DANGER
        val completed = dayTasks.count { it.completed }
        return when {
            completed == 0 -> DayStatus.DANGER
            completed == dayTasks.size -> DayStatus.SUCCESS
            else -> DayStatus.WARNING
        }
    }

    private fun calculateStats(days: List<DaySummary>): Stats {
        var streak = 0
        var longest = 0
        var success = 0
        var warning = 0
        var danger = 0
        days.forEach { day ->
            when (day.status) {
                DayStatus.SUCCESS -> {
                    success += 1
                    streak += 1
                }
                DayStatus.WARNING -> {
                    warning += 1
                    streak = 0
                }
                DayStatus.DANGER -> {
                    danger += 1
                    streak = 0
                }
            }
            if (streak > longest) longest = streak
        }
        return Stats(success = success, warning = warning, danger = danger, longestStreak = longest)
    }

    private fun seedDemoTasks() {
        val today = LocalDate.now()
        val monthStart = today.withDayOfMonth(1)
        repeat(4) { day ->
            val date = monthStart.plusDays(day.toLong()).toString()
            tasks += Task(
                id = UUID.randomUUID().toString(),
                title = "Daily planning",
                notes = "5-minute schedule review",
                date = date,
                completed = day % 3 != 0,
                recurring = "daily"
            )
            tasks += Task(
                id = UUID.randomUUID().toString(),
                title = "Ship feature work",
                notes = "Coding sprint",
                date = date,
                completed = day % 2 == 0,
                recurring = "daily"
            )
        }
        val weekend = monthStart.plusDays(6)
        tasks += Task(
            id = UUID.randomUUID().toString(),
            title = "Long run",
            notes = "8km endurance",
            date = weekend.toString(),
            completed = false,
            recurring = null
        )
    }
}
