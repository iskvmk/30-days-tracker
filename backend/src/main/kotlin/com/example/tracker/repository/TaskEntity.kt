package com.example.tracker.repository

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "tasks")
data class TaskEntity(
    @Id
    val id: String,
    @Column(nullable = false)
    val title: String,
    val notes: String? = null,
    @Column(nullable = false)
    val date: String,
    @Column(nullable = false)
    val completed: Boolean = false,
    val recurring: String? = null
)
