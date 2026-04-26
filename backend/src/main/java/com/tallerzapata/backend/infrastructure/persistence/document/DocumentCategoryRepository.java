package com.tallerzapata.backend.infrastructure.persistence.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentCategoryRepository extends JpaRepository<DocumentCategoryEntity, Long> {

    List<DocumentCategoryEntity> findByActiveTrueAndCaseTypeIdOrderByModuleCodeAscNameAsc(Long caseTypeId);

    List<DocumentCategoryEntity> findByActiveTrueAndCaseTypeIdIsNullOrderByModuleCodeAscNameAsc();

    List<DocumentCategoryEntity> findByActiveTrueOrderByModuleCodeAscNameAsc();
}
