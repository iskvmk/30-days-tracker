package com.example.tracker.repository

import org.springframework.data.jpa.repository.JpaRepository

interface TaskJpaRepository : JpaRepository<TaskEntity, String> {
    fun findAllByDate(date: String): List<TaskEntity>
}
