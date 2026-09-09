package com.tallerzapata.backend.infrastructure.persistence.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, Long> {

    @Query("select ur from UserRoleEntity ur where ur.userId = :userId and ur.active = true "
            + "and ur.effectiveFrom <= CURRENT_TIMESTAMP "
            + "and (ur.effectiveUntil is null or ur.effectiveUntil > CURRENT_TIMESTAMP)")
    List<UserRoleEntity> findByUserIdAndActiveTrue(@Param("userId") Long userId);

    @Query("select count(ur) > 0 from UserRoleEntity ur, RoleEntity r "
            + "where ur.roleId = r.id and ur.userId = :userId and ur.active = true "
            + "and ur.effectiveFrom <= CURRENT_TIMESTAMP "
            + "and (ur.effectiveUntil is null or ur.effectiveUntil > CURRENT_TIMESTAMP) "
            + "and r.code = 'ROLE_ADMIN' and r.active = true "
            + "and ur.organizationId is null and ur.branchId is null")
    boolean hasActiveGlobalAdminRole(@Param("userId") Long userId);

    List<UserRoleEntity> findByUserIdOrderByIdDesc(Long userId);

    @Modifying
    @Query("update UserRoleEntity ur set ur.active = false where ur.userId = :userId and ur.active = true")
    int deactivateAllActiveByUserId(@Param("userId") Long userId);

    /** Global role holders, such as ROLE_ADMIN recipients for system notifications. */
    @Query("select distinct ur.userId from UserRoleEntity ur, RoleEntity r, UserEntity u "
            + "where ur.roleId = r.id and ur.userId = u.id "
            + "and r.code = :roleCode and r.active = true "
            + "and ur.active = true and u.active = true "
            + "and ur.effectiveFrom <= CURRENT_TIMESTAMP "
            + "and (ur.effectiveUntil is null or ur.effectiveUntil > CURRENT_TIMESTAMP) "
            + "and ur.organizationId is null and ur.branchId is null")
    List<Long> findActiveGlobalUserIdsByRoleCode(@Param("roleCode") String roleCode);
}
