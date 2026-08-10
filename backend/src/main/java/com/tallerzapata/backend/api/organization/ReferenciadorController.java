package com.tallerzapata.backend.api.organization;

import com.tallerzapata.backend.application.organization.ReferenciadorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ReferenciadorController {

    private final ReferenciadorService service;

    public ReferenciadorController(ReferenciadorService service) { this.service = service; }

    @Operation(summary = "Listar referenciadores activos")
    @GetMapping("/referenciadores")
    public List<ReferenciadorResponse> listActivos(@RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "true") boolean active) { return service.list(q, active); }
    @GetMapping("/referenciadores/{id}") public ReferenciadorResponse get(@PathVariable Long id) { return service.get(id); }

    @Operation(summary = "Crear referenciador")
    @PostMapping("/referenciadores")
    public ReferenciadorResponse create(@Valid @RequestBody ReferenciadorRequest request, HttpServletRequest httpRequest) { return service.create(request, httpRequest); }
    @PutMapping("/referenciadores/{id}") public ReferenciadorResponse update(@PathVariable Long id, @Valid @RequestBody ReferenciadorRequest request, HttpServletRequest httpRequest) { return service.update(id, request, httpRequest); }
    @PostMapping("/referenciadores/{id}/deactivate") public ReferenciadorResponse deactivate(@PathVariable Long id, HttpServletRequest httpRequest) { return service.deactivate(id, httpRequest); }
}
