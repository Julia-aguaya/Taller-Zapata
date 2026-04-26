package com.tallerzapata.backend.infrastructure.persistence.person;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonAddressRepository extends JpaRepository<PersonAddressEntity, Long> {

    List<PersonAddressEntity> findByPersonIdOrderByPrincipalDescIdDesc(Long personId);

    Optional<PersonAddressEntity> findByIdAndPersonId(Long id, Long personId);

    @Modifying
    @Query("update PersonAddressEntity a set a.principal = false where a.personId = :personId")
    void resetPrincipalByPersonId(@Param("personId") Long personId);

    @Modifying
    @Query("update PersonAddressEntity a set a.principal = false where a.personId = :personId and a.id <> :addressId")
    void resetPrincipalByPersonIdAndIdNot(@Param("personId") Long personId, @Param("addressId") Long addressId);
}
