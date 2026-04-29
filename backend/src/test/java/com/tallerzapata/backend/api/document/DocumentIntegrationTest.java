package com.tallerzapata.backend.api.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() throws Exception {
        cleaner.cleanAll();
        Files.createDirectories(Path.of("target/test-storage"));
        try (var stream = Files.walk(Path.of("target/test-storage"))) {
            stream.sorted((a, b) -> b.getNameCount() - a.getNameCount())
                    .filter(path -> !path.equals(Path.of("target/test-storage")))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (Exception ignored) {
                        }
                    });
        }
        seedBaseData();
    }

    @Test
    void shouldUploadRelateListAndDownloadDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "orden-ingreso.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "documento operativo".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("categoryId", "1")
                        .param("documentDate", LocalDate.of(2026, 5, 10).toString())
                        .param("originCode", "OPERACION")
                        .param("observations", "Carga inicial")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long documentId = objectMapper.readTree(uploadResponse).get("id").asLong();

        DocumentRelationCreateRequest relationRequest = new DocumentRelationCreateRequest(
                100L,
                "CASO",
                100L,
                "OPERACION",
                true,
                true,
                1
        );

        mockMvc.perform(post("/api/v1/documents/{documentId}/relations", documentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(relationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityType").value("CASO"));

        mockMvc.perform(get("/api/v1/cases/100/documents")
                        .header("X-User-Id", "3")
                        .param("moduleCode", "OPERACION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].documentId").value(documentId))
                .andExpect(jsonPath("$[0].principal").value(true));

        mockMvc.perform(get("/api/v1/cases/100/documents/{documentId}/download", documentId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(content().bytes("documento operativo".getBytes()));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE accion_codigo IN ('subir_documento', 'relacionar_documento')",
                Integer.class
        );
        assertThat(auditCount).isEqualTo(2);
    }

    @Test
    void shouldExposeDocumentCatalogs() throws Exception {
        mockMvc.perform(get("/api/v1/documents/catalogs")
                        .header("X-User-Id", "3")
                        .param("moduleCode", "OPERACION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(3))
                .andExpect(jsonPath("$.categories[0].moduleCode").value("OPERACION"));
    }

    @Test
    void shouldUpdateRelationAndReplaceDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "foto-dano.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "version original".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("categoryId", "2")
                        .param("originCode", "OPERACION")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long documentId = objectMapper.readTree(uploadResponse).get("id").asLong();

        String relationResponse = mockMvc.perform(post("/api/v1/documents/{documentId}/relations", documentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(
                                100L,
                                "CASO",
                                100L,
                                "OPERACION",
                                false,
                                false,
                                5
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long relationId = objectMapper.readTree(relationResponse).get("id").asLong();

        mockMvc.perform(put("/api/v1/document-relations/{relationId}", relationId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationUpdateRequest(true, true, 1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.principal").value(true))
                .andExpect(jsonPath("$.visibleToCustomer").value(true));

        mockMvc.perform(put("/api/v1/documents/{documentId}", documentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentUpdateRequest(
                                2L,
                                "DETALLE",
                                null,
                                "OPERACION",
                                "Metadatos actualizados",
                                true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subcategoryCode").value("DETALLE"));

        MockMultipartFile replacementFile = new MockMultipartFile(
                "file",
                "foto-dano-v2.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "version reemplazada".getBytes()
        );

        String replaceResponse = mockMvc.perform(multipart("/api/v1/documents/{documentId}/replace", documentId)
                        .file(replacementFile)
                        .param("observations", "Reemplazo por nueva evidencia")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.replacesDocumentId").value(documentId))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long replacementId = objectMapper.readTree(replaceResponse).get("id").asLong();

        mockMvc.perform(get("/api/v1/documents/{documentId}", replacementId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        Integer activeCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM documentos WHERE activo = TRUE",
                Integer.class
        );
        Integer relationCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM documento_relaciones WHERE documento_id = ?",
                Integer.class,
                replacementId
        );
        assertThat(activeCount).isEqualTo(1);
        assertThat(relationCount).isEqualTo(1);
    }

    private void seedBaseData() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_vehiculos (id, caso_id, vehiculo_id, rol_vehiculo_codigo, es_principal, orden_visual) VALUES (?, ?, ?, ?, ?, ?)",
                1L, 100L, 10L, "PRINCIPAL", true, 1
        );
    }
}
