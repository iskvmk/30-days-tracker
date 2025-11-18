package com.example.tracker.model

data class Task(
    val id: String,
    val title: String,
    val notes: String? = null,
    val date: String,
    val completed: Boolean = false,
    val recurring: String? = null
)
