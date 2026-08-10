package com.tallerzapata.backend.application.provider;

import com.tallerzapata.backend.api.provider.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.provider.*;
import com.tallerzapata.backend.infrastructure.security.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class ProviderService {
    private final ProviderRepository repository; private final CurrentUserService users; private final CaseAccessControlService access; private final CaseAuditService audit;
    public ProviderService(ProviderRepository repository, CurrentUserService users, CaseAccessControlService access, CaseAuditService audit) { this.repository = repository; this.users = users; this.access = access; this.audit = audit; }
    @Transactional(readOnly = true) public List<ProviderResponse> list(String q, Boolean active) { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "proveedor.ver"); return repository.search(q == null ? "" : q.trim(), active == null ? true : active).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true) public ProviderResponse get(Long id) { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "proveedor.ver"); return toResponse(require(id)); }
    @Transactional public ProviderResponse create(ProviderRequest request, HttpServletRequest httpRequest) { AuthenticatedUser user = manage(); ProviderEntity entity = apply(new ProviderEntity(), request); entity = repository.save(entity); audit(user, entity, "crear_proveedor", httpRequest); return toResponse(entity); }
    @Transactional public ProviderResponse update(Long id, ProviderRequest request, HttpServletRequest httpRequest) { AuthenticatedUser user = manage(); ProviderEntity entity = apply(require(id), request); entity = repository.save(entity); audit(user, entity, "actualizar_proveedor", httpRequest); return toResponse(entity); }
    @Transactional public ProviderResponse deactivate(Long id, HttpServletRequest httpRequest) { AuthenticatedUser user = manage(); ProviderEntity entity = require(id); entity.setActive(false); audit(user, entity, "desactivar_proveedor", httpRequest); return toResponse(entity); }
    @Transactional(readOnly = true) public ProviderEntity requireActive(Long id) { ProviderEntity provider = require(id); if (!Boolean.TRUE.equals(provider.getActive())) throw new ConflictException("El proveedor esta inactivo: " + id); return provider; }
    private AuthenticatedUser manage() { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "proveedor.gestionar"); return user; }
    private ProviderEntity require(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("No existe el proveedor " + id)); }
    private ProviderEntity apply(ProviderEntity entity, ProviderRequest request) { entity.setName(request.name().trim()); entity.setPhone(blank(request.phone())); entity.setEmail(blank(request.email())); return entity; }
    private ProviderResponse toResponse(ProviderEntity e) { return new ProviderResponse(e.getId(), e.getPublicId(), e.getName(), e.getPhone(), e.getEmail(), e.getActive()); }
    private void audit(AuthenticatedUser user, ProviderEntity e, String action, HttpServletRequest request) { audit.register(user.id(), null, "proveedores", e.getId(), action, null, audit.toJson(Map.of("name", e.getName())), audit.toJson(Map.of("domain", "providers")), request); }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
