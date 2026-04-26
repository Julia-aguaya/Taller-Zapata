package com.tallerzapata.backend.infrastructure.persistence.person;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressTypeRepository extends JpaRepository<AddressTypeEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);
}
