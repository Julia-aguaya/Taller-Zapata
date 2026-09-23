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
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
        Long categoryId = activeCategoryId("PERSONAL");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "orden-ingreso.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "documento operativo".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("caseId", "100")
                        .param("categoryId", categoryId.toString())
                        .param("documentDate", LocalDate.of(2026, 5, 10).toString())
                        .param("originCode", "OPERACION")
                        .param("observations", "Carga inicial")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.observations").value("Carga inicial"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long documentId = objectMapper.readTree(uploadResponse).get("id").asLong();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT observaciones FROM documentos WHERE id = ?",
                String.class,
                documentId
        )).isEqualTo("Carga inicial");

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
                .andExpect(jsonPath("$[0].observations").value("Carga inicial"))
                .andExpect(jsonPath("$[0].principal").value(true));

        mockMvc.perform(get("/api/v1/cases/100/documents/{documentId}/download", documentId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(content().bytes("documento operativo".getBytes()));

        Long unrelatedModuleDocumentId = uploadDocument(categoryId, 100L, "3");
        mockMvc.perform(post("/api/v1/documents/{documentId}/relations", unrelatedModuleDocumentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(100L, "CASO", 100L, "EGRESO_DEFINITIVO", false, false, 2))))
                .andExpect(status().isOk());

        byte[] zipBytes = mockMvc.perform(get("/api/v1/cases/100/documents/zip")
                        .header("X-User-Id", "3")
                        .param("documentId", documentId.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        try (ZipInputStream zip = new ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
            assertThat(zip.getNextEntry().getName()).isEqualTo("orden-ingreso.txt");
            assertThat(zip.getNextEntry()).isNull();
        }

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE accion_codigo IN ('subir_documento', 'relacionar_documento')",
                Integer.class
        );
        assertThat(auditCount).isEqualTo(4);
    }

    @Test
    void shouldExposeDocumentCatalogs() throws Exception {
        mockMvc.perform(get("/api/v1/documents/catalogs")
                        .header("X-User-Id", "3")
                        .param("moduleCode", "OPERACION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(4))
                .andExpect(jsonPath("$.categories[?(@.code == 'PERSONAL')]").isNotEmpty())
                .andExpect(jsonPath("$.categories[?(@.code == 'VEHICULO')]").isNotEmpty())
                .andExpect(jsonPath("$.categories[?(@.code == 'SEGURO')]").isNotEmpty())
                .andExpect(jsonPath("$.categories[?(@.code == 'OTRO')]").isNotEmpty());
    }

    @Test
    void shouldUpdateRelationAndReplaceDocument() throws Exception {
        Long categoryId = activeCategoryId("OTRO");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "foto-dano.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "version original".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("caseId", "100")
                        .param("categoryId", categoryId.toString())
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
                                categoryId,
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
                        .header("X-User-Id", "1"))
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

        Long replacementRelationId = jdbcTemplate.queryForObject(
                "SELECT id FROM documento_relaciones WHERE documento_id = ?", Long.class, replacementId);
        mockMvc.perform(delete("/api/v1/document-relations/{relationId}", replacementRelationId)
                        .header("X-User-Id", "1")
                        .header("X-Change-Note", "Relación obsoleta"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/documents/{documentId}", replacementId)
                        .header("X-User-Id", "1")
                        .header("X-Change-Note", "Documento duplicado"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE accion_codigo IN ('reemplazar_documento', 'eliminar_relacion_documento', 'eliminar_documento')",
                Integer.class)).isEqualTo(3);
    }

    @Test
    void shouldAllowTheSameDocumentToBeRelatedToDifferentCaseModules() throws Exception {
        Long categoryId = activeCategoryId("OTRO");
        Long documentId = uploadDocument(categoryId, 100L, "3");

        for (String moduleCode : java.util.List.of("GESTION_TRAMITE", "PRESUPUESTO")) {
            mockMvc.perform(post("/api/v1/documents/{documentId}/relations", documentId)
                            .header("X-User-Id", "3")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(100L, "CASO", 100L, moduleCode, false, false, 0))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.moduleCode").value(moduleCode));
        }

        mockMvc.perform(get("/api/v1/cases/100/documents").header("X-User-Id", "3").param("moduleCode", "GESTION_TRAMITE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].moduleCode").value("GESTION_TRAMITE"));
        mockMvc.perform(get("/api/v1/cases/100/documents").header("X-User-Id", "3").param("moduleCode", "PRESUPUESTO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].moduleCode").value("PRESUPUESTO"));
    }

    @Test
    void shouldDenyOperatorDocumentAccessOutsideBranchAndOnClosedCases() throws Exception {
        Long categoryId = activeCategoryId("OTRO");
        Long foreignDocumentId = uploadDocument(categoryId, null, "1");
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "00000000-0000-0000-0000-000000003101", "0101PZ", 101L, 1L, 1L, 2L, 10L, 10L, false, 1L, "MEDIA");
        mockMvc.perform(post("/api/v1/documents/{documentId}/relations", foreignDocumentId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(101L, "CASO", 101L, "OPERACION", false, false, 0))))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/documents/{documentId}", foreignDocumentId).header("X-User-Id", "3"))
                .andExpect(status().isForbidden());

        Long ownDocumentId = uploadDocument(categoryId, 100L, "3");
        mockMvc.perform(post("/api/v1/documents/{documentId}/relations", ownDocumentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(100L, "CASO", 100L, "OPERACION", false, false, 0))))
                .andExpect(status().isOk());
        jdbcTemplate.update("UPDATE casos SET fecha_cierre = CURRENT_TIMESTAMP WHERE id = 100");
        mockMvc.perform(put("/api/v1/documents/{documentId}", ownDocumentId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentUpdateRequest(categoryId, null, null, "OPERACION", "No permitido", true))))
                .andExpect(status().isConflict());
        mockMvc.perform(multipart("/api/v1/documents").file(new MockMultipartFile("file", "closed.txt", MediaType.TEXT_PLAIN_VALUE, "closed".getBytes()))
                        .param("caseId", "100").param("categoryId", categoryId.toString()).header("X-User-Id", "3"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldAssembleMultipleResumableChunksIntoDocumentStorage() throws Exception {
        byte[] first = new byte[5 * 1024 * 1024];
        java.util.Arrays.fill(first, (byte) 'a');
        byte[] second = "segundo-chunk".getBytes();
        byte[] payload = new byte[first.length + second.length];
        System.arraycopy(first, 0, payload, 0, first.length);
        System.arraycopy(second, 0, payload, first.length, second.length);
        Long categoryId = activeCategoryId("OTRO");
        String sessionResponse = mockMvc.perform(post("/api/v1/document-uploads")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseId\":100,\"categoryId\":" + categoryId + ",\"fileName\":\"video.txt\",\"mimeType\":\"text/plain\",\"sizeBytes\":" + payload.length + ",\"checksumSha256\":\"" + sha256(payload) + "\",\"chunkCount\":2}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String uploadId = objectMapper.readTree(sessionResponse).get("uploadId").asText();
        uploadChunk(uploadId, 0, first).andExpect(status().isOk()).andExpect(jsonPath("$.nextChunk").value(1));
        uploadChunk(uploadId, 1, second).andExpect(status().isOk()).andExpect(jsonPath("$.nextChunk").value(2));
        String completed = mockMvc.perform(post("/api/v1/document-uploads/{uploadId}/complete", uploadId).header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long documentId = objectMapper.readTree(completed).get("id").asLong();
        mockMvc.perform(post("/api/v1/documents/{documentId}/relations", documentId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new DocumentRelationCreateRequest(100L, "CASO", 100L, "PRESUPUESTO", false, false, 0))))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases/100/documents/{documentId}/download", documentId).header("X-User-Id", "3"))
                .andExpect(status().isOk()).andExpect(content().bytes(payload));
    }

    @Test
    void shouldRejectOutOfOrderChunksAndAcceptOnlyMatchingRetries() throws Exception {
        byte[] payload = "abc".getBytes();
        Long categoryId = activeCategoryId("OTRO");
        String response = mockMvc.perform(post("/api/v1/document-uploads").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseId\":100,\"categoryId\":" + categoryId + ",\"fileName\":\"retry.txt\",\"mimeType\":\"text/plain\",\"sizeBytes\":3,\"checksumSha256\":\"" + sha256(payload) + "\",\"chunkCount\":1}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String uploadId = objectMapper.readTree(response).get("uploadId").asText();
        uploadChunk(uploadId, 1, payload).andExpect(status().isConflict());
        uploadChunk(uploadId, 0, payload).andExpect(status().isOk()).andExpect(jsonPath("$.nextChunk").value(1));
        uploadChunk(uploadId, 0, payload).andExpect(status().isOk()).andExpect(jsonPath("$.nextChunk").value(1));
        uploadChunk(uploadId, 0, "abd".getBytes()).andExpect(status().isConflict());
    }

    @Test
    void shouldAllowOnlyGlobalAdminToCompleteUploadSessionWithoutCase() throws Exception {
        byte[] payload = "logo-global".getBytes();
        Long categoryId = activeCategoryId("OTRO");
        String globalSession = mockMvc.perform(post("/api/v1/document-uploads").header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":" + categoryId + ",\"fileName\":\"logo.png\",\"mimeType\":\"image/png\",\"sizeBytes\":" + payload.length + ",\"checksumSha256\":\"" + sha256(payload) + "\",\"chunkCount\":1}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String uploadId = objectMapper.readTree(globalSession).get("uploadId").asText();
        mockMvc.perform(get("/api/v1/document-uploads/{uploadId}", uploadId).header("X-User-Id", "1")).andExpect(status().isOk());
        mockMvc.perform(multipart("/api/v1/document-uploads/{uploadId}/chunks/{index}", uploadId, 0)
                        .file(new MockMultipartFile("file", "chunk.bin", MediaType.APPLICATION_OCTET_STREAM_VALUE, payload))
                        .header("X-User-Id", "1").header("X-Chunk-Sha256", sha256(payload))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/document-uploads/{uploadId}/complete", uploadId).header("X-User-Id", "1")).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/document-uploads").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":" + categoryId + ",\"fileName\":\"operator.png\",\"mimeType\":\"image/png\",\"sizeBytes\":1,\"checksumSha256\":\"" + sha256(new byte[]{'x'}) + "\",\"chunkCount\":1}"))
                .andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.ResultActions uploadChunk(String uploadId, int index, byte[] content) throws Exception {
        return mockMvc.perform(multipart("/api/v1/document-uploads/{uploadId}/chunks/{index}", uploadId, index)
                .file(new MockMultipartFile("file", "chunk.bin", MediaType.APPLICATION_OCTET_STREAM_VALUE, content))
                .header("X-User-Id", "3").header("X-Chunk-Sha256", sha256(content)));
    }

    private String sha256(byte[] value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
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

    private Long activeCategoryId(String code) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM categorias_documentales WHERE codigo = ? AND activo = 1",
                Long.class,
                code
        );
    }

    private Long uploadDocument(Long categoryId, Long caseId, String userId) throws Exception {
        var request = multipart("/api/v1/documents")
                .file(new MockMultipartFile("file", "documento-" + userId + ".txt", MediaType.TEXT_PLAIN_VALUE, "contenido".getBytes()))
                .param("categoryId", categoryId.toString())
                .header("X-User-Id", userId);
        if (caseId != null) {
            request.param("caseId", caseId.toString());
        }
        String response = mockMvc.perform(request).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }
}
