package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.api.identity.PermissionResponse;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentRequest;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentResponse;
import com.tallerzapata.backend.api.identity.UserRolesUpdateRequest;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.security.PermissionRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.RoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.RoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class IdentityAdminService {

    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public IdentityAdminService(
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            PermissionRepository permissionRepository,
            UserRoleRepository userRoleRepository,
            UserRepository userRepository,
            RoleRepository roleRepository
    ) {
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "identity.permissions.read");

        return permissionRepository.findAllByOrderByCodeAsc().stream()
                .map(item -> new PermissionResponse(item.getId(), item.getCode()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserRoleAssignmentResponse> listUserRoles(Long userId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "identity.roles.manage");
        requireUser(userId);

        Map<Long, RoleEntity> rolesById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        return userRoleRepository.findByUserIdOrderByIdDesc(userId).stream()
                .map(item -> new UserRoleAssignmentResponse(
                        item.getRoleId(),
                        rolesById.containsKey(item.getRoleId()) ? rolesById.get(item.getRoleId()).getCode() : "UNKNOWN",
                        item.getOrganizationId(),
                        item.getBranchId(),
                        Boolean.TRUE.equals(item.getActive())
                ))
                .toList();
    }

    @Transactional
    public List<UserRoleAssignmentResponse> updateUserRoles(Long userId, UserRolesUpdateRequest request) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "identity.roles.manage");
        requireUser(userId);

        Map<Long, RoleEntity> rolesById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        userRoleRepository.deactivateAllActiveByUserId(userId);

        for (UserRoleAssignmentRequest assignment : request.assignments()) {
            if (!rolesById.containsKey(assignment.roleId())) {
                throw new ResourceNotFoundException("No existe el rol " + assignment.roleId());
            }
            UserRoleEntity entity = new UserRoleEntity();
            entity.setUserId(userId);
            entity.setRoleId(assignment.roleId());
            entity.setOrganizationId(assignment.organizationId());
            entity.setBranchId(assignment.branchId());
            entity.setActive(assignment.active() == null || assignment.active());
            userRoleRepository.save(entity);
        }

        return listUserRoles(userId);
    }

    private UserEntity requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + userId));
    }
}
