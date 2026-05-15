package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.api.identity.PermissionResponse;
import com.tallerzapata.backend.api.identity.BranchResponse;
import com.tallerzapata.backend.api.identity.OrganizationResponse;
import com.tallerzapata.backend.api.identity.RoleSummaryResponse;
import com.tallerzapata.backend.api.identity.UserCreateRequest;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentRequest;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentResponse;
import com.tallerzapata.backend.api.identity.UserSummaryResponse;
import com.tallerzapata.backend.api.identity.UserRolesUpdateRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ForbiddenException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.PermissionRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.RoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.RoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class IdentityAdminService {

    private final CurrentUserService currentUserService;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public IdentityAdminService(
            CurrentUserService currentUserService,
            PermissionRepository permissionRepository,
            UserRoleRepository userRoleRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            OrganizationRepository organizationRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.currentUserService = currentUserService;
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listOrganizations() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        List<UserRoleEntity> scopedRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        Set<Long> allowedOrganizationIds = scopedRoles.stream()
                .map(UserRoleEntity::getOrganizationId)
                .collect(Collectors.toSet());

        if (allowedOrganizationIds.isEmpty()) {
            return List.of();
        }

        return organizationRepository.findAllByOrderByNameAsc().stream()
                .filter(item -> allowedOrganizationIds.contains(item.getId()))
                .map(item -> new OrganizationResponse(item.getId(), item.getPublicId(), item.getCode(), item.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> listBranches(Long organizationId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        List<UserRoleEntity> scopedRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        Set<Long> fullAccessOrganizationIds = scopedRoles.stream()
                .filter(item -> item.getBranchId() == null)
                .map(UserRoleEntity::getOrganizationId)
                .collect(Collectors.toSet());
        Map<Long, Set<Long>> allowedBranchIdsByOrganizationId = scopedRoles.stream()
                .filter(item -> item.getBranchId() != null)
                .collect(Collectors.groupingBy(
                        UserRoleEntity::getOrganizationId,
                        Collectors.mapping(UserRoleEntity::getBranchId, Collectors.toSet())
                ));

        if (organizationId == null) {
            return branchRepository.findAllByOrderByNameAsc().stream()
                    .filter(item -> canReadBranch(item.getOrganizationId(), item.getId(), fullAccessOrganizationIds, allowedBranchIdsByOrganizationId))
                    .map(item -> new BranchResponse(item.getId(), item.getCode(), item.getName(), item.getOrganizationId()))
                    .toList();
        }

        return branchRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .filter(item -> canReadBranch(item.getOrganizationId(), item.getId(), fullAccessOrganizationIds, allowedBranchIdsByOrganizationId))
                .map(item -> new BranchResponse(item.getId(), item.getCode(), item.getName(), item.getOrganizationId()))
                .toList();
    }

    private boolean canReadBranch(
            Long organizationId,
            Long branchId,
            Set<Long> fullAccessOrganizationIds,
            Map<Long, Set<Long>> allowedBranchIdsByOrganizationId
    ) {
        if (fullAccessOrganizationIds.contains(organizationId)) {
            return true;
        }
        Set<Long> allowedBranchIds = allowedBranchIdsByOrganizationId.get(organizationId);
        return allowedBranchIds != null && allowedBranchIds.contains(branchId);
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.permissions.read");

        return permissionRepository.findAllByOrderByCodeAsc().stream()
                .map(item -> new PermissionResponse(item.getId(), item.getCode()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleSummaryResponse> listRoles() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");

        return roleRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                .map(item -> new RoleSummaryResponse(item.getId(), item.getCode(), item.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listUsers() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        List<UserRoleEntity> managerRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());

        return userRepository.findByActiveTrueOrderByFirstNameAscLastNameAsc().stream()
                .filter(user -> {
                    List<UserRoleEntity> targetRoles = userRoleRepository.findByUserIdAndActiveTrue(user.getId());
                    return targetRoles.isEmpty() || targetRoles.stream().allMatch(role -> canManageScope(managerRoles, role.getOrganizationId(), role.getBranchId()));
                })
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getPublicId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getActive()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserRoleAssignmentResponse> listUserRoles(Long userId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        requireUser(userId);
        List<UserRoleEntity> managerRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        List<UserRoleEntity> targetRoles = userRoleRepository.findByUserIdOrderByIdDesc(userId);
        ensureCanManageAllTargetRoles(managerRoles, targetRoles);

        Map<Long, RoleEntity> rolesById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        return targetRoles.stream()
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
        requirePermission(currentUser, "identity.roles.manage");
        requireUser(userId);
        List<UserRoleEntity> managerRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        List<UserRoleEntity> currentTargetRoles = userRoleRepository.findByUserIdAndActiveTrue(userId);
        ensureCanManageAllTargetRoles(managerRoles, currentTargetRoles);

        Map<Long, RoleEntity> rolesById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        userRoleRepository.deactivateAllActiveByUserId(userId);

        for (UserRoleAssignmentRequest assignment : request.assignments()) {
            if (!rolesById.containsKey(assignment.roleId())) {
                throw new ResourceNotFoundException("No existe el rol " + assignment.roleId());
            }
            validateRequestedScope(managerRoles, assignment.organizationId(), assignment.branchId());
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

    @Transactional
    public UserSummaryResponse createUser(UserCreateRequest request) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        List<UserRoleEntity> managerRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());

        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new ConflictException("Ya existe un usuario con ese email");
        }

        if (userRepository.existsByUsernameIgnoreCase(request.username().trim())) {
            throw new ConflictException("Ya existe un usuario con ese username");
        }

        if (!roleRepository.existsById(request.roleId())) {
            throw new ResourceNotFoundException("No existe el rol " + request.roleId());
        }

        validateRequestedScope(managerRoles, request.organizationId(), request.branchId());

        UserEntity entity = new UserEntity();
        entity.setPublicId(UUID.randomUUID().toString());
        entity.setUsername(request.username().trim());
        entity.setEmail(request.email().trim().toLowerCase());
        entity.setPasswordHash(passwordEncoder.encode(request.password()));
        entity.setFirstName(request.firstName().trim());
        entity.setLastName(blankToNull(request.lastName()));
        entity.setActive(request.active() == null || request.active());
        UserEntity saved = userRepository.save(entity);

        UserRoleEntity roleEntity = new UserRoleEntity();
        roleEntity.setUserId(saved.getId());
        roleEntity.setRoleId(request.roleId());
        roleEntity.setOrganizationId(request.organizationId());
        roleEntity.setBranchId(request.branchId());
        roleEntity.setActive(true);
        userRoleRepository.save(roleEntity);

        return new UserSummaryResponse(
                saved.getId(),
                saved.getPublicId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getActive()
        );
    }

    private UserEntity requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + userId));
    }

    private void ensureCanManageAllTargetRoles(List<UserRoleEntity> managerRoles, List<UserRoleEntity> targetRoles) {
        boolean hasOutsideScopeRoles = targetRoles.stream()
                .anyMatch(item -> !canManageScope(managerRoles, item.getOrganizationId(), item.getBranchId()));
        if (hasOutsideScopeRoles) {
            throw new ForbiddenException("No tenes alcance para gestionar los roles del usuario objetivo");
        }
    }

    private void validateRequestedScope(List<UserRoleEntity> managerRoles, Long organizationId, Long branchId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("No existe la organizacion " + organizationId);
        }

        if (branchId != null) {
            var branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + branchId));
            if (!branch.getOrganizationId().equals(organizationId)) {
                throw new ConflictException("La sucursal no pertenece a la organizacion indicada");
            }
        }

        if (!canManageScope(managerRoles, organizationId, branchId)) {
            throw new ForbiddenException("No tenes alcance para asignar ese scope de organizacion/sucursal");
        }
    }

    private void requirePermission(AuthenticatedUser currentUser, String permissionCode) {
        if (!currentUser.authorities().contains(permissionCode)) {
            throw new ForbiddenException("El usuario no tiene el permiso requerido: " + permissionCode);
        }
    }

    private boolean canManageScope(List<UserRoleEntity> managerRoles, Long organizationId, Long branchId) {
        return managerRoles.stream().anyMatch(role ->
                role.getOrganizationId().equals(organizationId)
                        && (role.getBranchId() == null || role.getBranchId().equals(branchId))
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
