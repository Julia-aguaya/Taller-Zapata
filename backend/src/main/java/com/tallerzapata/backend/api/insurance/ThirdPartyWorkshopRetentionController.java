package com.tallerzapata.backend.api.insurance;

import com.tallerzapata.backend.application.insurance.ThirdPartyWorkshopRetentionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/third-party/retentions")
public class ThirdPartyWorkshopRetentionController {
    private final ThirdPartyWorkshopRetentionService service;
    public ThirdPartyWorkshopRetentionController(ThirdPartyWorkshopRetentionService service) { this.service = service; }
    @GetMapping @PreAuthorize("hasAuthority('finanza.ver')")
    public ThirdPartyWorkshopRetentionPlanResponse get(@PathVariable Long caseId) { return service.get(caseId); }
    @PutMapping @PreAuthorize("hasAuthority('finanza.retencion.gestionar')")
    public ThirdPartyWorkshopRetentionPlanResponse save(@PathVariable Long caseId, @Valid @RequestBody ThirdPartyWorkshopRetentionRequest request, HttpServletRequest httpRequest) { return service.save(caseId, request, httpRequest); }
}
