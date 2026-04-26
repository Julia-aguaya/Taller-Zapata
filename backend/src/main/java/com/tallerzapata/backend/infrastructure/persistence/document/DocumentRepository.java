package com.tallerzapata.backend.infrastructure.persistence.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    Optional<DocumentEntity> findByIdAndActiveTrue(Long id);

    Optional<DocumentEntity> findByChecksumSha256AndSizeBytesAndActiveTrue(String checksumSha256, Long sizeBytes);

    List<DocumentEntity> findByIdIn(List<Long> ids);
}
