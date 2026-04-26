package com.tallerzapata.backend.api.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.auth.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdentityAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void prepareData() {
        jdbcTemplate.update("UPDATE usuarios SET password_hash = ? WHERE id = ?", passwordEncoder.encode("password"), 1L);
        jdbcTemplate.update("DELETE FROM usuario_roles WHERE usuario_id IN (?, ?, ?, ?)", 9L, 10L, 11L, 12L);
        jdbcTemplate.update("DELETE FROM usuarios WHERE id = ?", 9L);
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                9L,
                "00000000-0000-0000-0000-000000000900",
                "tester-roles",
                "tester-roles@tallerzapata.local",
                passwordEncoder.encode("password"),
                "Tester",
                "Roles",
                true
        );

        jdbcTemplate.update("DELETE FROM usuarios WHERE id = ?", 10L);
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                10L,
                "00000000-0000-0000-0000-000000000901",
                "tester-no-permissions",
                "tester-no-permissions@tallerzapata.local",
                passwordEncoder.encode("password"),
                "Tester",
                "NoPermissions",
                true
        );

        jdbcTemplate.update("DELETE FROM sucursales WHERE id IN (?, ?)", 3L, 4L);
        jdbcTemplate.update("DELETE FROM organizaciones WHERE id = ?", 2L);
        jdbcTemplate.update(
                "INSERT INTO organizaciones (id, public_id, codigo, nombre) VALUES (?, ?, ?, ?)",
                2L,
                "00000000-0000-0000-0000-000000000002",
                "TZ2",
                "Taller Zapata Norte"
        );
        jdbcTemplate.update(
                "INSERT INTO sucursales (id, organizacion_id, codigo, nombre) VALUES (?, ?, ?, ?)",
                3L,
                2L,
                "N",
                "Norte"
        );
        jdbcTemplate.update(
                "INSERT INTO sucursales (id, organizacion_id, codigo, nombre) VALUES (?, ?, ?, ?)",
                4L,
                2L,
                "O",
                "Oeste"
        );

        jdbcTemplate.update("DELETE FROM usuarios WHERE id = ?", 11L);
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                11L,
                "00000000-0000-0000-0000-000000000902",
                "tester-branch-scoped",
                "tester-branch-scoped@tallerzapata.local",
                passwordEncoder.encode("password"),
                "Tester",
                "BranchScoped",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                20L,
                11L,
                1L,
                2L,
                3L,
                true
        );

        jdbcTemplate.update("DELETE FROM usuarios WHERE id = ?", 12L);
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                12L,
                "00000000-0000-0000-0000-000000000903",
                "tester-target-mixed-scope",
                "tester-target-mixed-scope@tallerzapata.local",
                passwordEncoder.encode("password"),
                "Tester",
                "TargetMixedScope",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                21L,
                12L,
                2L,
                2L,
                3L,
                true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                22L,
                12L,
                2L,
                1L,
                1L,
                true
        );
    }

    @Test
    void shouldListPermissionsForAdmin() throws Exception {
        String accessToken = loginAndGetAccessToken();

        mockMvc.perform(get("/api/v1/permissions")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code=='identity.permissions.read')]").exists())
                .andExpect(jsonPath("$[?(@.code=='identity.roles.manage')]").exists());
    }

    @Test
    void shouldListOrganizationsAndBranchesForAdmin() throws Exception {
        String accessToken = loginAndGetAccessToken();

        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].code").value("TZ"));

        mockMvc.perform(get("/api/v1/branches")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].organizationId").value(1));

        mockMvc.perform(get("/api/v1/branches")
                        .param("organizationId", "1")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].organizationId").value(1));
    }

    @Test
    void shouldScopeOrganizationAndBranchCatalogsByCurrentUserRoles() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-branch-scoped@tallerzapata.local", "password");

        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(2));

        mockMvc.perform(get("/api/v1/branches")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].organizationId").value(2));

        mockMvc.perform(get("/api/v1/branches")
                        .param("organizationId", "2")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(3));

        mockMvc.perform(get("/api/v1/branches")
                        .param("organizationId", "1")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldScopeUserRoleListingByCurrentUserRoles() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-branch-scoped@tallerzapata.local", "password");

        mockMvc.perform(get("/api/v1/users/12/roles")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldListUserRolesWhenTargetIsFullyWithinManagerScope() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-branch-scoped@tallerzapata.local", "password");

        mockMvc.perform(get("/api/v1/users/11/roles")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].organizationId").value(2))
                .andExpect(jsonPath("$[0].branchId").value(3));
    }

    @Test
    void shouldRejectUserRoleUpdateWhenTargetHasRolesOutsideManagerScope() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-branch-scoped@tallerzapata.local", "password");
        UserRolesUpdateRequest request = new UserRolesUpdateRequest(
                java.util.List.of(
                        new UserRoleAssignmentRequest(2L, 2L, 3L, true)
                )
        );

        mockMvc.perform(put("/api/v1/users/12/roles")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectUserRoleUpdateWhenRequestedScopeIsOutsideManagerScope() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-branch-scoped@tallerzapata.local", "password");
        UserRolesUpdateRequest request = new UserRolesUpdateRequest(
                java.util.List.of(
                        new UserRoleAssignmentRequest(2L, 2L, 4L, true)
                )
        );

        mockMvc.perform(put("/api/v1/users/11/roles")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectOrganizationCatalogsWithoutIdentityPermission() throws Exception {
        String accessToken = loginAndGetAccessToken("tester-no-permissions@tallerzapata.local", "password");

        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldUpdateAndListUserRoles() throws Exception {
        String accessToken = loginAndGetAccessToken();
        UserRolesUpdateRequest request = new UserRolesUpdateRequest(
                java.util.List.of(
                        new UserRoleAssignmentRequest(2L, 1L, 1L, true)
                )
        );

        mockMvc.perform(put("/api/v1/users/9/roles")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roleId").value(2))
                .andExpect(jsonPath("$[0].roleCode").value("ROLE_OPERADOR"))
                .andExpect(jsonPath("$[0].organizationId").value(1))
                .andExpect(jsonPath("$[0].branchId").value(1));

        mockMvc.perform(get("/api/v1/users/9/roles")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roleCode").value("ROLE_OPERADOR"));
    }

    private String loginAndGetAccessToken() throws Exception {
        return loginAndGetAccessToken("admin@tallerzapata.local", "password");
    }

    private String loginAndGetAccessToken(String email, String password) throws Exception {
        LoginRequest request = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("accessToken").asText();
    }
}
