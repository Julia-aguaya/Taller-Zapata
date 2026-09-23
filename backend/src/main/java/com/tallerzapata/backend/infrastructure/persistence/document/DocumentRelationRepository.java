package com.tallerzapata.backend.infrastructure.persistence.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRelationRepository extends JpaRepository<DocumentRelationEntity, Long> {

    boolean existsByDocumentIdAndEntityTypeAndEntityId(Long documentId, String entityType, Long entityId);

    boolean existsByDocumentIdAndEntityTypeAndEntityIdAndModuleCode(Long documentId, String entityType, Long entityId, String moduleCode);

    List<DocumentRelationEntity> findByDocumentIdOrderByVisualOrderAscIdAsc(Long documentId);

    List<DocumentRelationEntity> findByCaseIdOrderByVisualOrderAscIdAsc(Long caseId);
}
