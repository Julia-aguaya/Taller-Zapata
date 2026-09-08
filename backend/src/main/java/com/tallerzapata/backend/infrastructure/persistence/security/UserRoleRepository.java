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

    /**
     * Usuarios con un rol activo dentro de una organizacion (ej. ROLE_ADMIN para avisos del sistema).
     * Theta-join porque UserRoleEntity y RoleEntity se vinculan solo por id, sin relacion JPA.
     */
    @Query("select distinct ur.userId from UserRoleEntity ur, RoleEntity r, UserEntity u "
            + "where ur.roleId = r.id and ur.userId = u.id "
            + "and r.code = :roleCode and r.active = true "
            + "and ur.active = true and u.active = true "
            + "and ur.organizationId = :organizationId")
    List<Long> findActiveUserIdsByRoleCodeAndOrganization(@Param("roleCode") String roleCode, @Param("organizationId") Long organizationId);
}
