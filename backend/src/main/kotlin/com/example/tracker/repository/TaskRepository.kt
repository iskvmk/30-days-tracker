package com.example.tracker.repository

import com.example.tracker.model.Task

interface TaskRepository {
    fun findByDate(date: String): List<Task>
    fun findById(id: String): Task?
    fun save(task: Task): Task
    fun update(task: Task): Task
}
