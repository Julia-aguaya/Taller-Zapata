package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.api.budget.BudgetComparisonDtos.*;
import com.tallerzapata.backend.application.budget.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/cases/{caseId}/budget-comparisons")
public class BudgetComparisonController {
    private final BudgetComparisonService service; private final BudgetComparisonPdfService pdfService;
    public BudgetComparisonController(BudgetComparisonService service, BudgetComparisonPdfService pdfService) { this.service=service; this.pdfService=pdfService; }
    @GetMapping @PreAuthorize("hasAuthority('presupuesto.ver')") public List<Snapshot> list(@PathVariable Long caseId, @RequestParam(required = false) String context) { return service.list(caseId, context); }
    @GetMapping("/{snapshotId}") @PreAuthorize("hasAuthority('presupuesto.ver')") public Detail detail(@PathVariable Long caseId,@PathVariable Long snapshotId) { return service.detail(caseId,snapshotId); }
    @GetMapping("/{snapshotId}/legacy-audit") @PreAuthorize("hasAuthority('presupuesto.ver')") public LegacyAudit legacyAudit(@PathVariable Long caseId,@PathVariable Long snapshotId) { return service.legacyAudit(caseId,snapshotId); }
    @PostMapping("/{snapshotId}/providers") @PreAuthorize("hasAuthority('presupuesto.crear')") public Detail addProvider(@PathVariable Long caseId,@PathVariable Long snapshotId,@Valid @RequestBody ProviderRequest request) { return service.addProvider(caseId,snapshotId,request); }
    @PatchMapping("/{snapshotId}/providers/{columnId}/terms") @PreAuthorize("hasAuthority('presupuesto.crear')") public Detail terms(@PathVariable Long caseId,@PathVariable Long snapshotId,@PathVariable Long columnId,@Valid @RequestBody TermsRequest request) { return service.updateTerms(caseId,snapshotId,columnId,request); }
    @DeleteMapping("/{snapshotId}/providers/{columnId}") @PreAuthorize("hasAuthority('presupuesto.crear')") public void deleteProvider(@PathVariable Long caseId,@PathVariable Long snapshotId,@PathVariable Long columnId) { service.deleteProvider(caseId,snapshotId,columnId); }
    @PatchMapping("/{snapshotId}/pieces/{pieceId}/prices/{columnId}") @PreAuthorize("hasAuthority('presupuesto.crear')") public Detail price(@PathVariable Long caseId,@PathVariable Long snapshotId,@PathVariable Long pieceId,@PathVariable Long columnId,@Valid @RequestBody PriceRequest request) { return service.upsertPrice(caseId,snapshotId,pieceId,columnId,request); }
    @DeleteMapping("/{snapshotId}/pieces/{pieceId}/prices/{columnId}") @PreAuthorize("hasAuthority('presupuesto.crear')") public void clearPrice(@PathVariable Long caseId,@PathVariable Long snapshotId,@PathVariable Long pieceId,@PathVariable Long columnId) { service.clearPrice(caseId,snapshotId,pieceId,columnId); }
    @PostMapping("/{snapshotId}/pieces/{pieceId}/providers/{columnId}/select") @PreAuthorize("hasAuthority('presupuesto.crear')") public Object selectQuote(@PathVariable Long caseId,@PathVariable Long snapshotId,@PathVariable Long pieceId,@PathVariable Long columnId) { return service.selectQuote(caseId,snapshotId,pieceId,columnId); }
    @GetMapping("/{snapshotId}/pdf") @PreAuthorize("hasAuthority('presupuesto.ver')") public ResponseEntity<byte[]> pdf(@PathVariable Long caseId,@PathVariable Long snapshotId) { byte[] bytes=pdfService.generate(service.detail(caseId,snapshotId)); return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header(HttpHeaders.CONTENT_DISPOSITION,"inline; filename=comparacion-"+snapshotId+".pdf").contentLength(bytes.length).body(bytes); }
}
