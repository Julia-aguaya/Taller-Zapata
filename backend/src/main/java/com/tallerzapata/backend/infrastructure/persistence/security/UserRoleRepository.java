package com.tallerzapata.backend.infrastructure.persistence.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, Long> {

    List<UserRoleEntity> findByUserIdAndActiveTrue(Long userId);

    List<UserRoleEntity> findByUserIdOrderByIdDesc(Long userId);

    @Modifying
    @Query("update UserRoleEntity ur set ur.active = false where ur.userId = :userId and ur.active = true")
    int deactivateAllActiveByUserId(@Param("userId") Long userId);
}
