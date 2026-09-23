package com.tallerzapata.backend.application.document;

import com.tallerzapata.backend.api.document.DocumentResponse;
import com.tallerzapata.backend.api.document.DocumentUploadSessionCreateRequest;
import com.tallerzapata.backend.api.document.DocumentUploadSessionResponse;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ForbiddenException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentCategoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentCategoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentUploadSessionEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentUploadSessionRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import com.tallerzapata.backend.infrastructure.storage.LocalDocumentUploadTemporaryStorage;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class DocumentUploadSessionService {
    private static final long CHUNK_SIZE = 5L * 1024 * 1024;
    private static final long MAX_FILE_SIZE = 512L * 1024 * 1024;
    private static final String ACTIVE = "ACTIVA";
    private static final String COMPLETED = "COMPLETADA";
    private final DocumentUploadSessionRepository sessionRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final LocalDocumentUploadTemporaryStorage temporaryStorage;
    private final DocumentStorageService documentStorageService;
    private final DocumentService documentService;

    public DocumentUploadSessionService(DocumentUploadSessionRepository sessionRepository, DocumentCategoryRepository categoryRepository,
            CaseRepository caseRepository, UserRepository userRepository,
            CurrentUserService currentUserService, CaseAccessControlService caseAccessControlService,
            LocalDocumentUploadTemporaryStorage temporaryStorage, DocumentStorageService documentStorageService, DocumentService documentService) {
        this.sessionRepository = sessionRepository; this.categoryRepository = categoryRepository;
        this.caseRepository = caseRepository; this.userRepository = userRepository; this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService; this.temporaryStorage = temporaryStorage;
        this.documentStorageService = documentStorageService; this.documentService = documentService;
    }

    @Transactional
    public DocumentUploadSessionResponse create(DocumentUploadSessionCreateRequest request) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(user, "documento.subir");
        validateCreateRequest(request);
        requireOpenCaseAccess(user, request.caseId());
        DocumentCategoryEntity category = requireActiveCategory(request.categoryId());
        if (Boolean.TRUE.equals(category.getRequiresDate()) && request.documentDate() == null) throw new ConflictException("La categoria requiere fecha de documento");
        userRepository.findById(user.id()).orElseThrow(() -> new ResourceNotFoundException("No existe el usuario autenticado " + user.id()));
        DocumentUploadSessionEntity session = new DocumentUploadSessionEntity();
        session.setCaseId(request.caseId()); session.setCategoryId(request.categoryId()); session.setFileName(safeFileName(request.fileName()));
        session.setMimeType(request.mimeType().trim()); session.setSizeBytes(request.sizeBytes()); session.setChecksumSha256(request.checksumSha256().toLowerCase());
        session.setChunkCount(request.chunkCount()); session.setNextChunk(0); session.setReceivedBytes(0L); session.setUploadedBy(user.id());
        session.setOriginCode(normalizeCode(request.originCode(), "TALLER")); session.setObservations(blankToNull(request.observations()));
        session.setDocumentDate(request.documentDate());
        session.setStatus(ACTIVE); session.setExpiresAt(LocalDateTime.now().plusHours(24));
        return response(sessionRepository.save(session), null);
    }

    @Transactional
    public DocumentUploadSessionResponse uploadChunk(String uploadId, int chunkIndex, String chunkChecksum, MultipartFile chunk) {
        DocumentUploadSessionEntity session = requireOwnedActiveSession(uploadId);
        if (chunk == null || chunk.isEmpty() || chunk.getSize() > CHUNK_SIZE || !isSha256(chunkChecksum)) throw new ConflictException("Chunk invalido");
        if (chunkIndex < session.getNextChunk()) {
            if (temporaryStorage.matches(uploadId, chunkIndex, chunk.getSize(), chunkChecksum)) return response(session, null);
            throw new ConflictException("El reintento no coincide con el chunk recibido");
        }
        if (chunkIndex != session.getNextChunk()) throw new ConflictException("Los chunks deben cargarse en orden");
        if (chunkIndex >= session.getChunkCount()) throw new ConflictException("Indice de chunk invalido");
        long remaining = session.getSizeBytes() - session.getReceivedBytes();
        long expectedMaximum = Math.min(CHUNK_SIZE, remaining);
        if (chunk.getSize() > expectedMaximum || (chunkIndex == session.getChunkCount() - 1 && chunk.getSize() != remaining)) throw new ConflictException("Tamano de chunk invalido");
        String storedChecksum = temporaryStorage.storeChunk(uploadId, chunkIndex, chunk);
        if (!storedChecksum.equalsIgnoreCase(chunkChecksum)) {
            temporaryStorage.delete(uploadId);
            throw new ConflictException("Checksum de chunk invalido");
        }
        session.setNextChunk(chunkIndex + 1); session.setReceivedBytes(session.getReceivedBytes() + chunk.getSize());
        session.setExpiresAt(LocalDateTime.now().plusHours(24));
        return response(sessionRepository.save(session), null);
    }

    @Transactional(readOnly = true)
    public DocumentUploadSessionResponse status(String uploadId) { return response(requireOwnedSession(uploadId), null); }

    @Transactional
    public DocumentResponse complete(String uploadId, HttpServletRequest request) {
        DocumentUploadSessionEntity session = requireOwnedActiveSession(uploadId);
        if (session.getNextChunk() != session.getChunkCount() || !session.getReceivedBytes().equals(session.getSizeBytes())) throw new ConflictException("La carga no esta completa");
        String extension = filenameExtension(session.getFileName());
        DocumentStorageService.StoredDocument stored;
        try (InputStream input = temporaryStorage.assemble(uploadId, session.getChunkCount())) {
            stored = documentStorageService.store(input, extension);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo cerrar la carga", exception);
        }
        try {
            try (InputStream input = documentStorageService.open(stored.storageKey()).getInputStream()) {
                if (stored.sizeBytes() != session.getSizeBytes() || !checksum(input).equalsIgnoreCase(session.getChecksumSha256())) {
                    documentStorageService.delete(stored.storageKey());
                    throw new ConflictException("El archivo ensamblado no supera la verificacion de integridad");
                }
            }
            DocumentEntity document = documentService.createStoredDocument(session.getFileName(), session.getMimeType(), session.getChecksumSha256(), session.getCategoryId(), session.getUploadedBy(), session.getOriginCode(), session.getObservations(), session.getDocumentDate(), stored, session.getCaseId(), request);
            session.setStatus(COMPLETED); session.setDocumentId(document.getId()); sessionRepository.save(session); temporaryStorage.delete(uploadId);
            return documentService.toDocumentResponse(document);
        } catch (IOException exception) {
            documentStorageService.delete(stored.storageKey());
            throw new IllegalStateException("No se pudo verificar el archivo ensamblado", exception);
        }
    }

    @Transactional
    public void abort(String uploadId) { DocumentUploadSessionEntity session = requireOwnedSession(uploadId); temporaryStorage.delete(uploadId); sessionRepository.delete(session); }

    @Scheduled(fixedDelayString = "${app.storage.upload-cleanup-delay-ms:3600000}")
    @Transactional
    public void cleanupExpired() { sessionRepository.findByStatusAndExpiresAtBefore(ACTIVE, LocalDateTime.now()).forEach(session -> { temporaryStorage.delete(session.getPublicId()); sessionRepository.delete(session); }); }

    private DocumentUploadSessionEntity requireOwnedActiveSession(String uploadId) { DocumentUploadSessionEntity session = requireOwnedSession(uploadId); if (!ACTIVE.equals(session.getStatus()) || session.getExpiresAt().isBefore(LocalDateTime.now())) throw new ConflictException("La sesion de carga no esta activa"); return session; }
    private DocumentUploadSessionEntity requireOwnedSession(String uploadId) { AuthenticatedUser user = currentUserService.requireCurrentUser(); DocumentUploadSessionEntity session = sessionRepository.findByPublicIdForUpdate(uploadId).orElseThrow(() -> new ResourceNotFoundException("No existe la sesion de carga")); if (!session.getUploadedBy().equals(user.id())) throw new ForbiddenException("La sesion de carga pertenece a otro usuario"); requireOpenCaseAccess(user, session.getCaseId()); return session; }
    private void requireOpenCaseAccess(AuthenticatedUser user, Long caseId) {
        if (caseId == null) {
            if (!caseAccessControlService.hasGlobalScope(user)) throw new ForbiddenException("Las cargas sin caso requieren alcance global");
            return;
        }
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(user, caseEntity, "documento.subir");
        if (!caseAccessControlService.hasGlobalScope(user) && caseEntity.getClosedAt() != null) throw new ConflictException("El caso esta cerrado; debe ser reabierto por un administrador para modificar documentos");
    }
    private DocumentCategoryEntity requireActiveCategory(Long categoryId) { DocumentCategoryEntity category = categoryRepository.findById(categoryId).orElseThrow(() -> new ResourceNotFoundException("No existe la categoria documental " + categoryId)); if (!Boolean.TRUE.equals(category.getActive())) throw new ConflictException("La categoria documental esta inactiva"); return category; }
    private void validateCreateRequest(DocumentUploadSessionCreateRequest request) { if (request.sizeBytes() > MAX_FILE_SIZE || request.chunkCount() != Math.toIntExact((request.sizeBytes() + CHUNK_SIZE - 1) / CHUNK_SIZE) || !isSha256(request.checksumSha256())) throw new ConflictException("Metadatos de carga invalidos"); }
    private boolean isSha256(String value) { return value != null && value.matches("[0-9a-fA-F]{64}"); }
    private DocumentUploadSessionResponse response(DocumentUploadSessionEntity session, Long documentId) { return new DocumentUploadSessionResponse(session.getPublicId(), session.getChunkCount(), session.getNextChunk(), session.getReceivedBytes(), session.getStatus(), session.getExpiresAt(), documentId == null ? session.getDocumentId() : documentId); }
    private String checksum(InputStream input) { try { MessageDigest digest = MessageDigest.getInstance("SHA-256"); byte[] buffer = new byte[8192]; for (int read; (read = input.read(buffer)) != -1; ) digest.update(buffer, 0, read); return HexFormat.of().formatHex(digest.digest()); } catch (Exception exception) { throw new IllegalStateException("No se pudo calcular el checksum", exception); } }
    private String safeFileName(String value) { String name = value == null ? "archivo.bin" : value.replace('\\', '_').replace('/', '_').replace("..", "_").trim(); return name.isBlank() ? "archivo.bin" : name; }
    private String filenameExtension(String name) { int dot = name.lastIndexOf('.'); return dot > 0 && dot < name.length() - 1 ? name.substring(dot + 1).toLowerCase() : null; }
    private String normalizeCode(String value, String fallback) { return StringUtils.hasText(value) ? value.trim().toUpperCase() : fallback; }
    private String blankToNull(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
}
