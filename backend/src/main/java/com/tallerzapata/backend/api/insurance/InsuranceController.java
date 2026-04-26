package com.tallerzapata.backend.api.insurance;

import com.tallerzapata.backend.application.insurance.InsuranceCatalogService;
import com.tallerzapata.backend.application.insurance.InsuranceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Seguros y Legal", description = "Gestion de aseguradoras, procesos de seguro, franquicias, CLEAS, terceros y aspectos legales")
public class InsuranceController {
    private final InsuranceCatalogService insuranceCatalogService;
    private final InsuranceService insuranceService;

    public InsuranceController(InsuranceCatalogService insuranceCatalogService, InsuranceService insuranceService) {
        this.insuranceCatalogService = insuranceCatalogService;
        this.insuranceService = insuranceService;
    }

    @Operation(summary = "Listar catalogos de seguros", description = "Devuelve los catalogos disponibles para seguros")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/insurance/catalogs")
    public InsuranceCatalogsResponse listCatalogs() { return insuranceCatalogService.listCatalogs(); }

    @Operation(summary = "Listar companias aseguradoras", description = "Devuelve el listado de companias de seguro")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/insurance/companies")
    public List<InsuranceCompanyResponse> listCompanies() { return insuranceService.listCompanies(); }

    @Operation(summary = "Crear compania aseguradora", description = "Crea una nueva compania de seguro")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PostMapping("/insurance/companies")
    public InsuranceCompanyResponse createCompany(@Valid @RequestBody InsuranceCompanyCreateRequest request, HttpServletRequest httpRequest) { return insuranceService.createCompany(request, httpRequest); }

    @Operation(summary = "Listar contactos de aseguradora", description = "Devuelve los contactos de una compania de seguro")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/insurance/companies/{companyId}/contacts")
    public List<InsuranceCompanyContactResponse> listCompanyContacts(@PathVariable Long companyId) { return insuranceService.listCompanyContacts(companyId); }

    @Operation(summary = "Crear contacto de aseguradora", description = "Agrega un contacto a una compania de seguro")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PostMapping("/insurance/companies/{companyId}/contacts")
    public InsuranceCompanyContactResponse createCompanyContact(@PathVariable Long companyId, @Valid @RequestBody InsuranceCompanyContactCreateRequest request, HttpServletRequest httpRequest) { return insuranceService.createCompanyContact(companyId, request, httpRequest); }

    @Operation(summary = "Obtener seguro de caso", description = "Devuelve la informacion de seguro de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/insurance")
    public CaseInsuranceResponse getCaseInsurance(@PathVariable Long caseId) { return insuranceService.getCaseInsurance(caseId); }

    @Operation(summary = "Actualizar seguro de caso", description = "Crea o actualiza la informacion de seguro de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/insurance")
    public CaseInsuranceResponse upsertCaseInsurance(@PathVariable Long caseId, @Valid @RequestBody CaseInsuranceUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseInsurance(caseId, request, httpRequest); }

    @Operation(summary = "Obtener procesamiento de seguro", description = "Devuelve el estado de procesamiento del seguro de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/insurance-processing")
    public InsuranceProcessingResponse getCaseInsuranceProcessing(@PathVariable Long caseId) { return insuranceService.getCaseInsuranceProcessing(caseId); }

    @Operation(summary = "Actualizar procesamiento de seguro", description = "Crea o actualiza el procesamiento del seguro de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/insurance-processing")
    public InsuranceProcessingResponse upsertCaseInsuranceProcessing(@PathVariable Long caseId, @RequestBody InsuranceProcessingUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseInsuranceProcessing(caseId, request, httpRequest); }

    @Operation(summary = "Obtener franquicia de caso", description = "Devuelve la informacion de franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/franchise")
    public CaseFranchiseResponse getCaseFranchise(@PathVariable Long caseId) { return insuranceService.getCaseFranchise(caseId); }

    @Operation(summary = "Actualizar franquicia de caso", description = "Crea o actualiza la franquicia de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/franchise")
    public CaseFranchiseResponse upsertCaseFranchise(@PathVariable Long caseId, @RequestBody CaseFranchiseUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseFranchise(caseId, request, httpRequest); }

    @Operation(summary = "Obtener CLEAS de caso", description = "Devuelve la informacion CLEAS de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/cleas")
    public CaseCleasResponse getCaseCleas(@PathVariable Long caseId) { return insuranceService.getCaseCleas(caseId); }

    @Operation(summary = "Actualizar CLEAS de caso", description = "Crea o actualiza la informacion CLEAS de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/cleas")
    public CaseCleasResponse upsertCaseCleas(@PathVariable Long caseId, @RequestBody CaseCleasUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseCleas(caseId, request, httpRequest); }

    @Operation(summary = "Obtener tercero de caso", description = "Devuelve la informacion de terceros involucrados en un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/third-party")
    public CaseThirdPartyResponse getCaseThirdParty(@PathVariable Long caseId) { return insuranceService.getCaseThirdParty(caseId); }

    @Operation(summary = "Actualizar tercero de caso", description = "Crea o actualiza la informacion de terceros de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/third-party")
    public CaseThirdPartyResponse upsertCaseThirdParty(@PathVariable Long caseId, @RequestBody CaseThirdPartyUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseThirdParty(caseId, request, httpRequest); }

    @Operation(summary = "Obtener legal de caso", description = "Devuelve la informacion legal de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/legal")
    public CaseLegalResponse getCaseLegal(@PathVariable Long caseId) { return insuranceService.getCaseLegal(caseId); }

    @Operation(summary = "Actualizar legal de caso", description = "Crea o actualiza la informacion legal de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PutMapping("/cases/{caseId}/legal")
    public CaseLegalResponse upsertCaseLegal(@PathVariable Long caseId, @RequestBody CaseLegalUpsertRequest request, HttpServletRequest httpRequest) { return insuranceService.upsertCaseLegal(caseId, request, httpRequest); }

    @Operation(summary = "Listar novedades legales", description = "Devuelve las novedades legales de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/legal-news")
    public List<LegalNewsResponse> listCaseLegalNews(@PathVariable Long caseId) { return insuranceService.listCaseLegalNews(caseId); }

    @Operation(summary = "Crear novedad legal", description = "Agrega una novedad legal a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PostMapping("/cases/{caseId}/legal-news")
    public LegalNewsResponse createCaseLegalNews(@PathVariable Long caseId, @RequestBody LegalNewsCreateRequest request, HttpServletRequest httpRequest) { return insuranceService.createCaseLegalNews(caseId, request, httpRequest); }

    @Operation(summary = "Listar gastos legales", description = "Devuelve los gastos legales de un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.ver')")
    @GetMapping("/cases/{caseId}/legal-expenses")
    public List<LegalExpenseResponse> listCaseLegalExpenses(@PathVariable Long caseId) { return insuranceService.listCaseLegalExpenses(caseId); }

    @Operation(summary = "Crear gasto legal", description = "Agrega un gasto legal a un caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('seguro.crear')")
    @PostMapping("/cases/{caseId}/legal-expenses")
    public LegalExpenseResponse createCaseLegalExpense(@PathVariable Long caseId, @RequestBody LegalExpenseCreateRequest request, HttpServletRequest httpRequest) { return insuranceService.createCaseLegalExpense(caseId, request, httpRequest); }
}
