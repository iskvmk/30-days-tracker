package com.example.tracker.model

data class DaySummary(
    val date: String,
    val status: DayStatus,
    val tasks: List<Task>
)
