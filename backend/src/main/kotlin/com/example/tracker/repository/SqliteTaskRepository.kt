package com.example.tracker.repository

import com.example.tracker.model.Task
import org.springframework.stereotype.Repository

@Repository
class SqliteTaskRepository(private val jpa: TaskJpaRepository) : TaskRepository {
    override fun findByDate(date: String): List<Task> =
        jpa.findAllByDate(date).map { it.toModel() }

    override fun findById(id: String): Task? =
        jpa.findById(id).orElse(null)?.toModel()

    override fun save(task: Task): Task =
        jpa.save(task.toEntity()).toModel()

    override fun update(task: Task): Task =
        jpa.save(task.toEntity()).toModel()
}

private fun TaskEntity.toModel(): Task =
    Task(
        id = id,
        title = title,
        notes = notes,
        date = date,
        completed = completed,
        recurring = recurring
    )

private fun Task.toEntity(): TaskEntity =
    TaskEntity(
        id = id,
        title = title,
        notes = notes,
        date = date,
        completed = completed,
        recurring = recurring
    )
