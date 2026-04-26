package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReentryStatusRepository extends JpaRepository<ReentryStatusEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<ReentryStatusEntity> findByActiveTrueOrderByNameAsc();
}
