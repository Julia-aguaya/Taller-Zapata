package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.application.common.ForbiddenException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CaseAccessControlService {

    private final UserRoleRepository userRoleRepository;

    public CaseAccessControlService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    public void requirePermission(AuthenticatedUser currentUser, String permissionCode) {
        if (!hasPermission(currentUser, permissionCode)) {
            throw new ForbiddenException("El usuario no tiene el permiso requerido: " + permissionCode);
        }
    }

    public boolean hasPermission(AuthenticatedUser currentUser, String permissionCode) {
        return currentUser.authorities().contains(permissionCode);
    }

    public void requireOrganizationScope(AuthenticatedUser currentUser, Long organizationId, Long branchId) {
        if (!hasOrganizationScope(currentUser, organizationId, branchId)) {
            throw new ForbiddenException("El usuario no tiene alcance para operar sobre esa organizacion/sucursal");
        }
    }

    public boolean hasOrganizationScope(AuthenticatedUser currentUser, Long organizationId, Long branchId) {
        if (hasGlobalScope(currentUser)) {
            return true;
        }
        List<UserRoleEntity> roles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        return roles.stream().anyMatch(role ->
                organizationId.equals(role.getOrganizationId())
                        && branchId != null
                        && branchId.equals(role.getBranchId())
        );
    }

    /** ROLE_ADMIN with no organization/branch is the explicitly global security mechanism. */
    public boolean hasGlobalScope(AuthenticatedUser currentUser) {
        return userRoleRepository.hasActiveGlobalAdminRole(currentUser.id());
    }

    public void requireCaseAccess(AuthenticatedUser currentUser, CaseEntity caseEntity, String permissionCode) {
        requirePermission(currentUser, permissionCode);
        requireOrganizationScope(currentUser, caseEntity.getOrganizationId(), caseEntity.getBranchId());
    }
}
