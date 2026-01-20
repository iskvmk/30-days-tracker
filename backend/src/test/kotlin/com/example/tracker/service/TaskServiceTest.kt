package com.example.tracker.service

import com.example.tracker.model.DayStatus
import com.example.tracker.model.Task
import com.example.tracker.repository.TaskRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate

class TaskServiceTest {
    private class FakeTaskRepository : TaskRepository {
        val tasks = mutableListOf<Task>()
        var updateCalls = 0
        var saveCalls = 0

        override fun findByDate(date: String): List<Task> =
            tasks.filter { it.date == date }

        override fun findById(id: String): Task? =
            tasks.firstOrNull { it.id == id }

        override fun save(task: Task): Task {
            saveCalls += 1
            tasks += task
            return task
        }

        override fun update(task: Task): Task {
            updateCalls += 1
            val idx = tasks.indexOfFirst { it.id == task.id }
            if (idx == -1) {
                throw IllegalArgumentException("Task ${task.id} not found")
            }
            tasks[idx] = task
            return task
        }
    }

    @Test
    fun listMonthBuildsDayStatusesAndStats() {
        val repo = FakeTaskRepository()
        repo.tasks += Task(id = "1", title = "A", date = "2024-04-01", completed = true)
        repo.tasks += Task(id = "2", title = "B", date = "2024-04-01", completed = true)
        repo.tasks += Task(id = "3", title = "C", date = "2024-04-02", completed = true)
        repo.tasks += Task(id = "4", title = "D", date = "2024-04-02", completed = false)

        val service = TaskService(repo)
        val summary = service.listMonth(2024, 4)

        val day1 = summary.days.first { it.date == "2024-04-01" }
        val day2 = summary.days.first { it.date == "2024-04-02" }

        assertEquals(DayStatus.SUCCESS, day1.status)
        assertEquals(DayStatus.WARNING, day2.status)
        assertEquals(1, summary.stats.success)
        assertEquals(1, summary.stats.warning)
        assertEquals(28, summary.stats.danger)
        assertEquals(1, summary.stats.longestStreak)
    }

    @Test
    fun toggleTaskDoesNotChangePastTasks() {
        val repo = FakeTaskRepository()
        val yesterday = LocalDate.now().minusDays(1).toString()
        val task = Task(id = "t1", title = "Locked", date = yesterday, completed = false)
        repo.tasks += task

        val service = TaskService(repo)
        val result = service.toggleTask("t1")

        assertEquals(task, result)
        assertEquals(0, repo.updateCalls)
        assertFalse(repo.tasks.first().completed)
    }

    @Test
    fun addTaskAssignsIdAndSaves() {
        val repo = FakeTaskRepository()
        val service = TaskService(repo)
        val input = Task(id = "temp", title = "New", date = LocalDate.now().toString())

        val saved = service.addTask(input)

        assertNotEquals("temp", saved.id)
        assertEquals(1, repo.saveCalls)
        assertEquals(saved, repo.tasks.first())
    }
}
