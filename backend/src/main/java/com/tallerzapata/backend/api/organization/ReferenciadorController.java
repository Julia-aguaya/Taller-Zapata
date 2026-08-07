package com.tallerzapata.backend.api.organization;

import com.tallerzapata.backend.infrastructure.persistence.organization.ReferenciadorEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.ReferenciadorRepository;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ReferenciadorController {

    private final ReferenciadorRepository repository;

    public ReferenciadorController(ReferenciadorRepository repository) { this.repository = repository; }

    @Operation(summary = "Listar referenciadores activos")
    @GetMapping("/referenciadores")
    public List<Map<String, Object>> listActivos(@RequestParam(defaultValue = "") String q) {
        List<ReferenciadorEntity> list = q.isBlank() ? repository.findByActivoTrueOrderByNombreAsc() : repository.search(q);
        return list.stream().map(r -> Map.<String, Object>of("id", r.getId(), "nombre", r.getNombre(), "apellido", r.getApellido() != null ? r.getApellido() : "", "telefono", r.getTelefono() != null ? r.getTelefono() : "", "displayName", (r.getNombre() + " " + (r.getApellido() != null ? r.getApellido() : "")).trim())).toList();
    }

    @Operation(summary = "Crear referenciador")
    @PostMapping("/referenciadores")
    public Map<String, Object> create(@RequestBody Map<String, String> body) {
        ReferenciadorEntity r = new ReferenciadorEntity();
        r.setNombre(body.get("nombre"));
        r.setApellido(body.getOrDefault("apellido", ""));
        r.setTelefono(body.getOrDefault("telefono", ""));
        r.setActivo(true);
        r = repository.save(r);
        return Map.of("id", r.getId(), "nombre", r.getNombre(), "apellido", r.getApellido() != null ? r.getApellido() : "", "telefono", r.getTelefono() != null ? r.getTelefono() : "", "displayName", (r.getNombre() + " " + (r.getApellido() != null ? r.getApellido() : "")).trim());
    }
}
