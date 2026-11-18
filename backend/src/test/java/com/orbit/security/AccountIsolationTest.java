package com.orbit.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("sqlite")
@AutoConfigureMockMvc
class AccountIsolationTest {
    private static final Path DATABASE = testDatabase();

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DATABASE);
        registry.add("orbit.demo.seed", () -> false);
        registry.add("orbit.demo.anonymous", () -> false);
        registry.add("orbit.ai.gemini.api-key", () -> "demo_key");
        registry.add("orbit.jwt.secret", () -> "");
        registry.add("orbit.jwt.access-token-expiration-ms", () -> 300_000);
    }

    private static Path testDatabase() {
        try {
            Path database = Files.createTempFile("orbit-account-", ".sqlite");
            database.toFile().deleteOnExit();
            return database;
        } catch (IOException error) {
            throw new IllegalStateException("Cannot create test database", error);
        }
    }

    @Test
    void privateResourcesAreScopedToTheAuthenticatedAccount() throws Exception {
        call(GET, "/tasks", null, null).andExpect(status().isUnauthorized());
        call(GET, "/auth/me", null, null).andExpect(status().isUnauthorized());

        Account first = register("first");
        Account second = register("second");
        String firstBoard = data(call(GET, "/boards", first.access(), null), 200).get(0).get("id").asText();
        String secondBoard = data(call(GET, "/boards", second.access(), null), 200).get(0).get("id").asText();
        String firstTask = addTask(first, firstBoard, second.id());
        String secondTask = addTask(second, secondBoard, first.id());
        String path = "/tasks/" + firstTask;

        call(GET, "/tasks", second.access(), null).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].id").value(secondTask));
        call(GET, "/tasks?boardId=" + firstBoard, second.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        call(GET, "/tasks/prioritized?status=BACKLOG", second.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].id").value(secondTask));
        call(POST, "/tasks/rescue", second.access(), Map.of("currentEnergy", "LOW"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.task.id").value(secondTask));

        String subtask = data(call(POST, path + "/subtasks/bulk", first.access(), Map.of(
                "subtasks", new Object[]{Map.of("title", "Mở tài liệu", "estimatedMinutes", 3)})), 201)
            .get("subtasks").get(0).get("id").asText();

        call(GET, path, second.access(), null).andExpect(status().isNotFound());
        call(DELETE, path, second.access(), null).andExpect(status().isNotFound());
        call(PUT, path, second.access(), Map.of("title", "Việc khác")).andExpect(status().isNotFound());
        call(PATCH, path + "/status", second.access(), Map.of("status", "DOING")).andExpect(status().isNotFound());
        call(POST, path + "/ai-decompose", second.access(), null).andExpect(status().isNotFound());
        call(GET, path + "/subtasks", second.access(), null).andExpect(status().isNotFound());
        call(POST, path + "/subtasks/bulk", second.access(), Map.of("subtasks", new Object[]{}))
            .andExpect(status().isNotFound());
        call(PATCH, "/tasks/" + secondTask + "/subtasks/" + subtask + "/toggle", second.access(), null)
            .andExpect(status().isNotFound());
        call(PATCH, path + "/subtasks/" + subtask + "/toggle", first.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.isCompleted").value(true));

        call(GET, "/boards/" + firstBoard, second.access(), null).andExpect(status().isNotFound());
        call(POST, "/tasks", second.access(), Map.of("title", "Việc mới", "boardId", firstBoard))
            .andExpect(status().isNotFound());
        call(PUT, "/tasks/" + secondTask, second.access(), Map.of("boardId", firstBoard))
            .andExpect(status().isNotFound());
        call(POST, "/focus/sessions", second.access(), Map.of("taskId", firstTask, "durationMinutes", 25))
            .andExpect(status().isNotFound());

        call(GET, "/users/me/streak?userId=" + first.id(), second.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.userId").value(second.id()));
        call(POST, "/focus/sessions?userId=" + first.id(), second.access(), Map.of(
            "taskId", secondTask, "durationMinutes", 3)).andExpect(status().isCreated());
        call(GET, "/focus/sessions/today?userId=" + second.id(), first.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void archivedBoardMetadataCanBeRequestedByItsOwner() throws Exception {
        Account owner = register("archive-owner");
        Account other = register("archive-other");
        String board = data(call(GET, "/boards", owner.access(), null), 200).get(0).get("id").asText();
        call(PATCH, "/boards/" + board + "/archive", owner.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.isArchived").value(true));
        call(GET, "/boards", owner.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data[?(@.id == '%s')].id", board).isEmpty());
        call(GET, "/boards?includeArchived=true", owner.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data[?(@.id == '%s')].isArchived", board)
                .value(org.hamcrest.Matchers.contains(true)));
        call(GET, "/boards?includeArchived=true", other.access(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data[?(@.id == '%s')].id", board).isEmpty());
    }

    @Test
    void refreshTokensAndAccessTokensHaveDistinctPurposes() throws Exception {
        Account account = register("session");
        call(GET, "/tasks", account.refresh(), null).andExpect(status().isUnauthorized());
        call(POST, "/auth/refresh", null, Map.of("refreshToken", account.access()))
            .andExpect(status().isUnauthorized());

        JsonNode response = data(call(POST, "/auth/refresh", null, Map.of("refreshToken", account.refresh())), 200);
        assertThat(response.get("user").get("id").asText()).isEqualTo(account.id());
        call(GET, "/auth/me", response.get("accessToken").asText(), null)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(account.id()));
    }

    private record Account(String id, String access, String refresh) {
    }

    private Account register(String name) throws Exception {
        String email = name + "-" + UUID.randomUUID() + "@example.com";
        String password = "Orbit-test-only-2026!";
        var credentials = Map.of("email", email, "password", password, "displayName", name);
        JsonNode profile = data(call(POST, "/auth/register", null, credentials)
            .andExpect(jsonPath("$.data.accessToken").doesNotExist())
            .andExpect(jsonPath("$.data.refreshToken").doesNotExist()), 201);
        call(POST, "/auth/register", null, credentials).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Email này đã có tài khoản. Bạn có thể đăng nhập bằng email này."));
        JsonNode session = data(call(POST, "/auth/login", null, Map.of("email", email, "password", password)), 200);
        assertThat(session.get("user").get("id")).isEqualTo(profile.get("id"));
        return new Account(profile.get("id").asText(), session.get("accessToken").asText(),
            session.get("refreshToken").asText());
    }

    private String addTask(Account account, String boardId, String suppliedUserId) throws Exception {
        JsonNode task = data(call(POST, "/tasks", account.access(), Map.of("title", "Việc riêng",
            "boardId", boardId, "userId", suppliedUserId)), 201);
        assertThat(task.get("userId").asText()).isEqualTo(account.id());
        return task.get("id").asText();
    }

    private JsonNode data(ResultActions actions, int expected) throws Exception {
        return json.readTree(actions.andExpect(status().is(expected)).andReturn()
            .getResponse().getContentAsByteArray()).get("data");
    }

    private ResultActions call(org.springframework.http.HttpMethod method, String path, String token, Object body)
            throws Exception {
        var request = request(method, "/api/v1" + path);
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.contentType("application/json").content(json.writeValueAsBytes(body));
        return mvc.perform(request);
    }
}
