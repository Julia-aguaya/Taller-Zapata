package com.tallerzapata.backend.api.cleas;

import com.tallerzapata.backend.api.insurance.CaseCleasResponse;
import com.tallerzapata.backend.api.insurance.CaseCleasUpsertRequest;
import com.tallerzapata.backend.api.insurance.CaseInsuranceResponse;
import com.tallerzapata.backend.api.insurance.CaseInsuranceUpsertRequest;
import com.tallerzapata.backend.api.insurance.InsuranceProcessingPatchRequest;
import com.tallerzapata.backend.api.insurance.InsuranceProcessingResponse;
import com.tallerzapata.backend.application.cleas.CleasManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/cleas")
public class CleasManagementController {
    private final CleasManagementService service;

    public CleasManagementController(CleasManagementService service) {
        this.service = service;
    }

    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/definition")
    public CaseCleasResponse getDefinition(@PathVariable Long caseId) { return service.getDefinition(caseId); }

    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/definition")
    public CaseCleasResponse upsertDefinition(@PathVariable Long caseId, @RequestBody CaseCleasUpsertRequest request, HttpServletRequest httpRequest) { return service.upsertDefinition(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/insurance")
    public CaseInsuranceResponse getInsurance(@PathVariable Long caseId) { return service.getInsurance(caseId); }

    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/insurance")
    public CaseInsuranceResponse upsertInsurance(@PathVariable Long caseId, @Valid @RequestBody CaseInsuranceUpsertRequest request, HttpServletRequest httpRequest) { return service.upsertInsurance(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('caso.ver')")
    @GetMapping("/incident")
    public CleasIncidentResponse getIncident(@PathVariable Long caseId) { return service.getIncident(caseId); }

    @PreAuthorize("hasAuthority('caso.crear')")
    @PutMapping("/incident")
    public CleasIncidentResponse upsertIncident(@PathVariable Long caseId, @RequestBody CleasIncidentUpsertRequest request, HttpServletRequest httpRequest) { return service.upsertIncident(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/processing")
    public InsuranceProcessingResponse getProcessing(@PathVariable Long caseId) { return service.getProcessing(caseId); }

    @PreAuthorize("hasAuthority('seguro.crear')")
    @PatchMapping("/processing")
    public InsuranceProcessingResponse patchProcessing(@PathVariable Long caseId, @RequestBody InsuranceProcessingPatchRequest request, HttpServletRequest httpRequest) { return service.patchProcessing(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('seguro.crear')")
    @PostMapping("/close")
    public CleasClosureResponse close(@PathVariable Long caseId, HttpServletRequest httpRequest) { return service.close(caseId, httpRequest); }

    @PreAuthorize("hasAuthority('finanza.ver')")
    @GetMapping("/summary")
    public CleasCompanyPaymentSummaryResponse summary(@PathVariable Long caseId) { return service.companyPaymentSummary(caseId); }

    @PreAuthorize("hasAuthority('finanza.crear')")
    @PostMapping("/company-payments")
    public CleasCompanyPaymentResponse registerCompanyPayment(@PathVariable Long caseId, @RequestBody CleasCompanyPaymentRequest request, HttpServletRequest httpRequest) { return service.registerCompanyPayment(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('documento.ver')")
    @GetMapping("/orders")
    public List<CleasOrderResponse> listOrders(@PathVariable Long caseId) { return service.listOrders(caseId); }

    @PreAuthorize("hasAuthority('documento.crear')")
    @PostMapping("/orders")
    public CleasOrderResponse createOrder(@PathVariable Long caseId, @Valid @RequestBody CleasOrderCreateRequest request, HttpServletRequest httpRequest) { return service.createOrder(caseId, request, httpRequest); }

    @PreAuthorize("hasAuthority('documento.crear')")
    @DeleteMapping("/orders/{relationId}")
    public void deleteOrder(@PathVariable Long caseId, @PathVariable Long relationId, HttpServletRequest httpRequest) { service.deleteOrder(caseId, relationId, httpRequest); }
}
