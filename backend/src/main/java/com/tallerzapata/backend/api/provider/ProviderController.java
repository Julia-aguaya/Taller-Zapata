package com.tallerzapata.backend.api.provider;

import com.tallerzapata.backend.application.provider.ProviderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {
    private final ProviderService service;
    public ProviderController(ProviderService service) { this.service = service; }
    @GetMapping public List<ProviderResponse> list(@RequestParam(defaultValue = "") String q, @RequestParam(required = false) Boolean active) { return service.list(q, active); }
    @GetMapping("/{id}") public ProviderResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping public ProviderResponse create(@Valid @RequestBody ProviderRequest request, HttpServletRequest httpRequest) { return service.create(request, httpRequest); }
    @PutMapping("/{id}") public ProviderResponse update(@PathVariable Long id, @Valid @RequestBody ProviderRequest request, HttpServletRequest httpRequest) { return service.update(id, request, httpRequest); }
    @PostMapping("/{id}/deactivate") public ProviderResponse deactivate(@PathVariable Long id, HttpServletRequest httpRequest) { return service.deactivate(id, httpRequest); }
}
