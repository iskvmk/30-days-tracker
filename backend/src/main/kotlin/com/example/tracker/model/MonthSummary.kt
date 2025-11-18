package com.example.tracker.model

data class MonthSummary(
    val year: Int,
    val month: Int,
    val days: List<DaySummary>,
    val stats: Stats
)

data class Stats(
    val success: Int,
    val warning: Int,
    val danger: Int,
    val longestStreak: Int
)
