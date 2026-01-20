package com.example.tracker.controller

import com.example.tracker.service.TaskService
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(TaskController::class)
class TaskControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var service: TaskService

    @Test
    fun monthRejectsInvalidMonth() {
        mockMvc.perform(get("/api/months/2024/13"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun monthRejectsInvalidYear() {
        mockMvc.perform(get("/api/months/0/1"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun toggleReturnsNotFoundWhenMissing() {
        `when`(service.toggleTask("missing")).thenReturn(null)

        mockMvc.perform(post("/api/tasks/missing/toggle"))
            .andExpect(status().isNotFound)
    }
}
