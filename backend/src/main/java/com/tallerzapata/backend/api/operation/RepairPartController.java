package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.application.operation.RepairPartService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RepairPartController {
    private final RepairPartService repairPartService;

    public RepairPartController(RepairPartService repairPartService) {
        this.repairPartService = repairPartService;
    }

    @GetMapping("/api/v1/cases/{caseId}/repair-parts")
    @PreAuthorize("hasAuthority('turno.ver')")
    public List<RepairPartResponse> list(@PathVariable Long caseId) {
        return repairPartService.list(caseId);
    }

    @PutMapping("/api/v1/cases/{caseId}/repair-parts/{partId}")
    @PreAuthorize("hasAuthority('turno.editar')")
    public RepairPartResponse update(@PathVariable Long caseId, @PathVariable Long partId,
                                     @Valid @RequestBody RepairPartUpdateRequest request,
                                     HttpServletRequest httpRequest) {
        return repairPartService.update(caseId, partId, request, httpRequest);
    }
}
