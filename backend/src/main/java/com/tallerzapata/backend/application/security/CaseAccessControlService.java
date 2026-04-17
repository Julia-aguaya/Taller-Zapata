package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.application.common.ConflictException;
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
        if (!currentUser.authorities().contains(permissionCode)) {
            throw new ConflictException("El usuario no tiene el permiso requerido: " + permissionCode);
        }
    }

    public void requireOrganizationScope(AuthenticatedUser currentUser, Long organizationId, Long branchId) {
        List<UserRoleEntity> roles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        boolean allowed = roles.stream().anyMatch(role ->
                role.getOrganizationId().equals(organizationId)
                        && (role.getBranchId() == null || role.getBranchId().equals(branchId))
        );

        if (!allowed) {
            throw new ConflictException("El usuario no tiene alcance para operar sobre esa organizacion/sucursal");
        }
    }

    public void requireCaseAccess(AuthenticatedUser currentUser, CaseEntity caseEntity, String permissionCode) {
        requirePermission(currentUser, permissionCode);
        requireOrganizationScope(currentUser, caseEntity.getOrganizationId(), caseEntity.getBranchId());
    }
}
