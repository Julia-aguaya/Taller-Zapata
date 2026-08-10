package com.tallerzapata.backend.application.organization;

import com.tallerzapata.backend.api.organization.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.organization.*;
import com.tallerzapata.backend.infrastructure.security.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class ReferenciadorService {
    private final ReferenciadorRepository repository; private final CurrentUserService users; private final CaseAccessControlService access; private final CaseAuditService audit;
    public ReferenciadorService(ReferenciadorRepository repository, CurrentUserService users, CaseAccessControlService access, CaseAuditService audit) { this.repository = repository; this.users = users; this.access = access; this.audit = audit; }
    @Transactional(readOnly = true) public List<ReferenciadorResponse> list(String q, boolean activeOnly) { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "caso.ver"); return (activeOnly ? (q.isBlank() ? repository.findByActivoTrueOrderByNombreAsc() : repository.search(q.trim())) : repository.searchAll(q.trim())).stream().map(this::response).toList(); }
    @Transactional(readOnly = true) public ReferenciadorResponse get(Long id) { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "caso.ver"); return response(require(id)); }
    @Transactional public ReferenciadorResponse create(ReferenciadorRequest request, HttpServletRequest servletRequest) { AuthenticatedUser user = manage(); ReferenciadorEntity entity = apply(new ReferenciadorEntity(), request); entity.setActivo(true); entity = repository.save(entity); audit(user, entity, "crear_referenciador", servletRequest); return response(entity); }
    @Transactional public ReferenciadorResponse update(Long id, ReferenciadorRequest request, HttpServletRequest servletRequest) { AuthenticatedUser user = manage(); ReferenciadorEntity entity = apply(require(id), request); entity = repository.save(entity); audit(user, entity, "actualizar_referenciador", servletRequest); return response(entity); }
    @Transactional public ReferenciadorResponse deactivate(Long id, HttpServletRequest servletRequest) { AuthenticatedUser user = manage(); ReferenciadorEntity entity = require(id); entity.setActivo(false); audit(user, entity, "desactivar_referenciador", servletRequest); return response(entity); }
    private AuthenticatedUser manage() { AuthenticatedUser user = users.requireCurrentUser(); access.requirePermission(user, "caso.crear"); return user; }
    private ReferenciadorEntity require(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("No existe el referenciador " + id)); }
    private ReferenciadorEntity apply(ReferenciadorEntity e, ReferenciadorRequest r) { e.setNombre(r.nombre().trim()); e.setApellido(blank(r.apellido())); e.setTelefono(blank(r.telefono())); return e; }
    private ReferenciadorResponse response(ReferenciadorEntity e) { String name = (e.getNombre() + " " + (e.getApellido() == null ? "" : e.getApellido())).trim(); return new ReferenciadorResponse(e.getId(), e.getNombre(), e.getApellido(), e.getTelefono(), name, e.isActivo()); }
    private void audit(AuthenticatedUser user, ReferenciadorEntity e, String action, HttpServletRequest request) { audit.register(user.id(), null, "referenciadores", e.getId(), action, null, audit.toJson(Map.of("name", e.getNombre())), audit.toJson(Map.of("domain", "casos")), request); }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
