package com.tallerzapata.backend.infrastructure.persistence.person;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactTypeRepository extends JpaRepository<ContactTypeEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);
}
