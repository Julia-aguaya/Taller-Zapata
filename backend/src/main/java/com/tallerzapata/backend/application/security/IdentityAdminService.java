package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.api.identity.PermissionResponse;
import com.tallerzapata.backend.api.identity.BranchResponse;
import com.tallerzapata.backend.api.identity.BranchUpdateRequest;
import com.tallerzapata.backend.api.identity.OrganizationResponse;
import com.tallerzapata.backend.api.identity.OrganizationUpdateRequest;
import com.tallerzapata.backend.api.identity.RoleSummaryResponse;
import com.tallerzapata.backend.api.identity.UserCreateRequest;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentRequest;
import com.tallerzapata.backend.api.identity.UserRoleAssignmentResponse;
import com.tallerzapata.backend.api.identity.UserSummaryResponse;
import com.tallerzapata.backend.api.identity.UserRolesUpdateRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ForbiddenException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
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
    private final CaseAccessControlService accessControlService;

    public IdentityAdminService(
            CurrentUserService currentUserService,
            PermissionRepository permissionRepository,
            UserRoleRepository userRoleRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            OrganizationRepository organizationRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder,
            CaseAccessControlService accessControlService
    ) {
        this.currentUserService = currentUserService;
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessControlService = accessControlService;
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listOrganizations() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        if (accessControlService.hasGlobalScope(currentUser)) {
            return organizationRepository.findAllByOrderByNameAsc().stream()
                    .map(item -> new OrganizationResponse(item.getId(), item.getPublicId(), item.getCode(), item.getName(), item.getRazonSocial(), item.getCuit(), item.getCondicionIva(), item.getPhone(), item.getEmail(), item.getLogoDocumentId()))
                    .toList();
        }
        List<UserRoleEntity> scopedRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        Set<Long> allowedOrganizationIds = scopedRoles.stream()
                .map(UserRoleEntity::getOrganizationId)
                .collect(Collectors.toSet());

        if (allowedOrganizationIds.isEmpty()) {
            return List.of();
        }

        return organizationRepository.findAllByOrderByNameAsc().stream()
                .filter(item -> allowedOrganizationIds.contains(item.getId()))
                .map(item -> new OrganizationResponse(item.getId(), item.getPublicId(), item.getCode(), item.getName(), item.getRazonSocial(), item.getCuit(), item.getCondicionIva(), item.getPhone(), item.getEmail(), item.getLogoDocumentId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> listBranches(Long organizationId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        if (accessControlService.hasGlobalScope(currentUser)) {
            return organizationId == null
                    ? branchRepository.findAllByOrderByNameAsc().stream().map(this::toBranchResponse).toList()
                    : branchRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream().map(this::toBranchResponse).toList();
        }
        List<UserRoleEntity> scopedRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        Map<Long, Set<Long>> allowedBranchIdsByOrganizationId = scopedRoles.stream()
                .filter(item -> item.getBranchId() != null)
                .collect(Collectors.groupingBy(
                        UserRoleEntity::getOrganizationId,
                        Collectors.mapping(UserRoleEntity::getBranchId, Collectors.toSet())
                ));

        if (organizationId == null) {
            return branchRepository.findAllByOrderByNameAsc().stream()
                    .filter(item -> canReadBranch(item.getOrganizationId(), item.getId(), allowedBranchIdsByOrganizationId))
                    .map(this::toBranchResponse)
                    .toList();
        }

        return branchRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .filter(item -> canReadBranch(item.getOrganizationId(), item.getId(), allowedBranchIdsByOrganizationId))
                .map(this::toBranchResponse)
                .toList();
    }

    @Transactional
    public OrganizationResponse updateOrganization(Long organizationId, OrganizationUpdateRequest request) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        OrganizationEntity entity = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la organizacion " + organizationId));
        if (request.name() != null) entity.setName(request.name());
        if (request.razonSocial() != null) entity.setRazonSocial(request.razonSocial());
        if (request.cuit() != null) entity.setCuit(request.cuit());
        if (request.condicionIva() != null) entity.setCondicionIva(request.condicionIva());
        if (request.phone() != null) entity.setPhone(request.phone());
        if (request.email() != null) entity.setEmail(request.email());
        if (request.logoDocumentId() != null) entity.setLogoDocumentId(request.logoDocumentId());
        entity = organizationRepository.save(entity);
        return new OrganizationResponse(entity.getId(), entity.getPublicId(), entity.getCode(), entity.getName(), entity.getRazonSocial(), entity.getCuit(), entity.getCondicionIva(), entity.getPhone(), entity.getEmail(), entity.getLogoDocumentId());
    }

    @Transactional
    public BranchResponse updateBranch(Long branchId, BranchUpdateRequest request) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        requirePermission(currentUser, "identity.roles.manage");
        BranchEntity entity = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + branchId));
        if (request.name() != null) entity.setName(request.name());
        if (request.addressLine1() != null) entity.setAddressLine1(request.addressLine1());
        if (request.city() != null) entity.setCity(request.city());
        if (request.province() != null) entity.setProvince(request.province());
        if (request.phone() != null) entity.setPhone(request.phone());
        if (request.email() != null) entity.setEmail(request.email());
        entity = branchRepository.save(entity);
        return new BranchResponse(entity.getId(), entity.getCode(), entity.getName(), entity.getOrganizationId(), entity.getAddressLine1(), entity.getCity(), entity.getProvince(), entity.getPhone(), entity.getEmail());
    }

    private boolean canReadBranch(
            Long organizationId,
            Long branchId,
            Map<Long, Set<Long>> allowedBranchIdsByOrganizationId
    ) {
        Set<Long> allowedBranchIds = allowedBranchIdsByOrganizationId.get(organizationId);
        return allowedBranchIds != null && allowedBranchIds.contains(branchId);
    }

    private BranchResponse toBranchResponse(BranchEntity item) {
        return new BranchResponse(item.getId(), item.getCode(), item.getName(), item.getOrganizationId(), item.getAddressLine1(), item.getCity(), item.getProvince(), item.getPhone(), item.getEmail());
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
        boolean globalManager = accessControlService.hasGlobalScope(currentUser);

        return userRepository.findByActiveTrueOrderByFirstNameAscLastNameAsc().stream()
                .filter(user -> {
                    List<UserRoleEntity> targetRoles = userRoleRepository.findByUserIdAndActiveTrue(user.getId());
                    return globalManager || targetRoles.isEmpty() || targetRoles.stream().allMatch(role -> canManageScope(managerRoles, role.getOrganizationId(), role.getBranchId()));
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
        ensureCanManageAllTargetRoles(currentUser, managerRoles, targetRoles);

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
        ensureCanManageAllTargetRoles(currentUser, managerRoles, currentTargetRoles);

        Map<Long, RoleEntity> rolesById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        userRoleRepository.deactivateAllActiveByUserId(userId);

        for (UserRoleAssignmentRequest assignment : request.assignments()) {
            if (!rolesById.containsKey(assignment.roleId())) {
                throw new ResourceNotFoundException("No existe el rol " + assignment.roleId());
            }
            validateRequestedScope(currentUser, managerRoles, rolesById.get(assignment.roleId()), assignment.organizationId(), assignment.branchId());
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

        RoleEntity role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el rol " + request.roleId()));

        validateRequestedScope(currentUser, managerRoles, role, request.organizationId(), request.branchId());

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

    private void ensureCanManageAllTargetRoles(AuthenticatedUser currentUser, List<UserRoleEntity> managerRoles, List<UserRoleEntity> targetRoles) {
        if (accessControlService.hasGlobalScope(currentUser)) {
            return;
        }
        boolean hasOutsideScopeRoles = targetRoles.stream()
                .anyMatch(item -> !canManageScope(managerRoles, item.getOrganizationId(), item.getBranchId()));
        if (hasOutsideScopeRoles) {
            throw new ForbiddenException("No tenes alcance para gestionar los roles del usuario objetivo");
        }
    }

    private void validateRequestedScope(AuthenticatedUser currentUser, List<UserRoleEntity> managerRoles, RoleEntity role, Long organizationId, Long branchId) {
        if ("ROLE_ADMIN".equals(role.getCode())) {
            if (organizationId != null || branchId != null) {
                throw new ConflictException("ROLE_ADMIN debe asignarse con alcance global");
            }
            if (!accessControlService.hasGlobalScope(currentUser)) {
                throw new ForbiddenException("Solo un administrador global puede asignar ROLE_ADMIN");
            }
            return;
        }
        if (organizationId == null || branchId == null) {
            throw new ConflictException("Los roles no administrativos requieren organizacion y sucursal");
        }
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

        if (!accessControlService.hasGlobalScope(currentUser) && !canManageScope(managerRoles, organizationId, branchId)) {
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
                organizationId.equals(role.getOrganizationId())
                        && branchId != null
                        && branchId.equals(role.getBranchId())
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
