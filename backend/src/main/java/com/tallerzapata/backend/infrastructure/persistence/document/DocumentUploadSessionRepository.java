package com.tallerzapata.backend.infrastructure.persistence.document;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DocumentUploadSessionRepository extends JpaRepository<DocumentUploadSessionEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from DocumentUploadSessionEntity session where session.publicId = :publicId")
    Optional<DocumentUploadSessionEntity> findByPublicIdForUpdate(String publicId);
    List<DocumentUploadSessionEntity> findByStatusAndExpiresAtBefore(String status, LocalDateTime expiresAt);
}
