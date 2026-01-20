package com.example.tracker.controller

import com.example.tracker.model.MonthSummary
import com.example.tracker.model.Task
import com.example.tracker.service.TaskService
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class TaskController(private val service: TaskService) {

    @GetMapping("/months/{year}/{month}")
    fun month(@PathVariable year: Int, @PathVariable month: Int): MonthSummary {
        if (month !in 1..12) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be 1..12")
        }
        if (year < 1) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "year must be positive")
        }
        return service.listMonth(year, month)
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    fun addTask(@RequestBody task: Task): Task = service.addTask(task)

    @PostMapping("/tasks/{taskId}/toggle")
    fun toggleTask(@PathVariable taskId: String): Task =
        service.toggleTask(taskId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "task not found")
}
