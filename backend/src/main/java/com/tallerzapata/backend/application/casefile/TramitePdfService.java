package com.tallerzapata.backend.application.casefile;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.insurance.InsuranceService;
import com.tallerzapata.backend.api.insurance.InsuranceProcessingResponse;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.*;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class TramitePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat CURRENCY_FMT = new DecimalFormat("$ #,##0.00");

    private final CaseRepository caseRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final CasePersonRepository casePersonRepository;
    private final InsuranceService insuranceService;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final InsuranceCompanyRepository companyRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;

    public TramitePdfService(CaseRepository caseRepository,
                              CaseIncidentRepository caseIncidentRepository,
                              CaseInsuranceRepository caseInsuranceRepository,
                              CasePersonRepository casePersonRepository,
                               InsuranceService insuranceService,
                             CaseFranchiseRepository caseFranchiseRepository,
                             InsuranceCompanyRepository companyRepository,
                             PersonRepository personRepository,
                             VehicleRepository vehicleRepository,
                             OrganizationRepository organizationRepository,
                             BranchRepository branchRepository) {
        this.caseRepository = caseRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.casePersonRepository = casePersonRepository;
        this.insuranceService = insuranceService;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.companyRepository = companyRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
    }

    public byte[] generate(Long caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        OrganizationEntity org = organizationRepository.findById(caseEntity.getOrganizationId()).orElse(null);
        BranchEntity branch = branchRepository.findById(caseEntity.getBranchId()).orElse(null);
        return generatePdf(caseEntity, org, branch);
    }

    private byte[] generatePdf(CaseEntity caseEntity, OrganizationEntity org, BranchEntity branch) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(30, 64, 120));
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font redFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.RED);

            // ── Header ──
            PdfPTable headerBand = new PdfPTable(2);
            headerBand.setWidthPercentage(100);
            headerBand.setWidths(new float[]{3, 1});

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph(org != null ? org.getName() : "Taller Zapata", brandFont));
            if (branch != null) {
                String branchLine = (branch.getName() != null ? branch.getName() : "");
                if (branch.getAddressLine1() != null) branchLine += " — " + branch.getAddressLine1();
                if (branch.getPhone() != null) branchLine += " — " + branch.getPhone();
                if (!branchLine.isBlank()) brandCell.addElement(new Paragraph(branchLine.trim(), smallFont));
            }
            headerBand.addCell(brandCell);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            titleCell.addElement(new Paragraph("GESTIÓN DEL TRÁMITE", titleFont));
            titleCell.addElement(new Paragraph("Fecha: " + java.time.LocalDate.now().format(DATE_FMT), smallFont));
            headerBand.addCell(titleCell);
            document.add(headerBand);

            // ── Case identity ──
            PersonEntity customer = caseEntity.getPrincipalCustomerPersonId() != null
                    ? personRepository.findById(caseEntity.getPrincipalCustomerPersonId()).orElse(null) : null;
            VehicleEntity vehicle = caseEntity.getPrincipalVehicleId() != null
                    ? vehicleRepository.findById(caseEntity.getPrincipalVehicleId()).orElse(null) : null;
            String caseLabel = (caseEntity.getFolderCode() != null ? caseEntity.getFolderCode() : "Caso #" + caseEntity.getId())
                    + (customer != null ? " — " + customer.getNombreMostrar() : "")
                    + (vehicle != null ? " — " + vehicle.getPlate() : "");
            Paragraph caseIdPara = new Paragraph(caseLabel, boldFont);
            caseIdPara.setSpacingBefore(10);
            caseIdPara.setSpacingAfter(15);
            document.add(caseIdPara);

            // ── 1. Datos generales del trámite ──
            addSection(document, "Datos generales del trámite");
            CaseIncidentEntity incident = caseIncidentRepository.findByCaseId(caseEntity.getId()).orElse(null);
            if (incident != null) {
                PdfPTable genTable = new PdfPTable(4);
                genTable.setWidthPercentage(100);
                genTable.setWidths(new float[]{1, 1, 1, 1});
                genTable.setSpacingAfter(10);
                addCell(genTable, "Fecha del siniestro", boldFont);
                addCell(genTable, incident.getIncidentDate() != null ? incident.getIncidentDate().format(DATE_FMT) : "—", normalFont);
                addCell(genTable, "Prescripción", boldFont);
                PdfPCell prescCell = new PdfPCell(new Phrase(incident.getPrescriptionDate() != null ? incident.getPrescriptionDate().format(DATE_FMT) : "—", redFont));
                prescCell.setBorder(Rectangle.BOX);
                prescCell.setBorderColor(Color.RED);
                prescCell.setPadding(5);
                genTable.addCell(prescCell);
                addCell(genTable, "Días tramitando", boldFont);
                addCell(genTable, incident.getDaysInProcess() != null ? String.valueOf(incident.getDaysInProcess()) : "—", normalFont);
                addCell(genTable, "", normalFont); addCell(genTable, "", normalFont);
                document.add(genTable);
            }

            // ── 2. Datos del seguro ──
            addSection(document, "Datos del seguro");
            CaseInsuranceEntity insurance = caseInsuranceRepository.findByCaseId(caseEntity.getId()).orElse(null);
            if (insurance != null) {
                InsuranceCompanyEntity company = insurance.getInsuranceCompanyId() != null
                        ? companyRepository.findById(insurance.getInsuranceCompanyId()).orElse(null) : null;

                PdfPTable insTable = new PdfPTable(2);
                insTable.setWidthPercentage(100);
                insTable.setWidths(new float[]{1, 3});
                insTable.setSpacingAfter(8);

                addCell(insTable, "Cía. aseguradora", boldFont);
                addCell(insTable, company != null ? company.getName() : "—", normalFont);
                addCell(insTable, "N° de Póliza", boldFont);
                addCell(insTable, nvl(insurance.getPolicyNumber()), normalFont);
                addCell(insTable, "N° de Certificado", boldFont);
                addCell(insTable, nvl(insurance.getCertificateNumber()), normalFont);
                addCell(insTable, "N° de Siniestro", boldFont);
                addCell(insTable, nvl(insurance.getClaimNumber()), normalFont);

                // Tramitador
                PersonEntity tramitador = resolveCasePerson(caseEntity.getId(), insurance.getProcessorCasePersonId());
                addCell(insTable, "Tramitador/a", boldFont);
                if (tramitador != null) {
                    addCell(insTable, tramitador.getNombreMostrar() + " — " + nvl(tramitador.getEmailPrincipal()) + " — " + nvl(tramitador.getTelefonoPrincipal()), normalFont);
                } else {
                    addCell(insTable, "—", normalFont);
                }

                // Inspector
                PersonEntity inspector = resolveCasePerson(caseEntity.getId(), insurance.getInspectorCasePersonId());
                addCell(insTable, "Inspector/a", boldFont);
                if (inspector != null) {
                    addCell(insTable, inspector.getNombreMostrar() + " — " + nvl(inspector.getEmailPrincipal()) + " — " + nvl(inspector.getTelefonoPrincipal()), normalFont);
                } else {
                    addCell(insTable, "—", normalFont);
                }

                document.add(insTable);

                // Coverage detail
                addField(document, "Detalle de la cobertura", nvl(insurance.getCoverageDetail()), true);
            }

            // ── 3. Datos del siniestro ──
            addSection(document, "Datos del siniestro");
            if (incident != null) {
                PdfPTable stroTable = new PdfPTable(2);
                stroTable.setWidthPercentage(100);
                stroTable.setWidths(new float[]{1, 3});
                stroTable.setSpacingAfter(8);
                addCell(stroTable, "Lugar de ocurrencia", boldFont);
                addCell(stroTable, nvl(incident.getLugar()), normalFont);
                addCell(stroTable, "Hora", boldFont);
                addCell(stroTable, incident.getIncidentTime() != null ? incident.getIncidentTime().toString() : "—", normalFont);
                document.add(stroTable);

                addField(document, "Dinámica del siniestro", nvl(incident.getDinamica()), true);
            }

            // ── 4. Franquicia ──
            addSection(document, "Franquicia");
            CaseFranchiseEntity franchise = caseFranchiseRepository.findByCaseId(caseEntity.getId()).orElse(null);
            if (franchise != null) {
                PdfPTable frTable = new PdfPTable(4);
                frTable.setWidthPercentage(100);
                frTable.setWidths(new float[]{1, 1, 1, 1});
                frTable.setSpacingAfter(8);
                addCell(frTable, "Estado", boldFont);
                addCell(frTable, franchise.getFranchiseStatusCode() != null ? franchise.getFranchiseStatusCode() : "Pendiente", normalFont);
                addCell(frTable, "Monto", boldFont);
                addCell(frTable, franchise.getFranchiseAmount() != null ? CURRENCY_FMT.format(franchise.getFranchiseAmount()) : "—", normalFont);
                addCell(frTable, "Recupero", boldFont);
                addCell(frTable, franchise.getRecoveryTypeCode() != null ? franchise.getRecoveryTypeCode() : "—", normalFont);
                addCell(frTable, "Caso asociado", boldFont);
                addCell(frTable, franchise.getRelatedCaseId() != null ? String.valueOf(franchise.getRelatedCaseId()) : "—", normalFont);
                addCell(frTable, "Dictamen", boldFont);
                addCell(frTable, franchise.getFranchiseOpinionCode() != null ? franchise.getFranchiseOpinionCode() : "—", normalFont);
                addCell(frTable, "Supera Franquicia", boldFont);
                addCell(frTable, Boolean.TRUE.equals(franchise.getExceedsFranchise()) ? "SI" : "NO", normalFont);
                addCell(frTable, "Monto a recuperar", boldFont);
                addCell(frTable, franchise.getRecoveryAmount() != null ? CURRENCY_FMT.format(franchise.getRecoveryAmount()) : "—", normalFont);
                addCell(frTable, "", normalFont); addCell(frTable, "", normalFont);
                document.add(frTable);

                addField(document, "Anotaciones", nvl(franchise.getNotes()), true);
            }

            // ── 5. Tramitación ──
            addSection(document, "Tramitación");
            InsuranceProcessingResponse processing = insuranceService.getCaseInsuranceProcessing(caseEntity.getId());
            if (processing != null) {
                PdfPTable tramTable = new PdfPTable(4);
                tramTable.setWidthPercentage(100);
                tramTable.setWidths(new float[]{1, 1, 1, 1});
                tramTable.setSpacingAfter(8);
                addCell(tramTable, "Fecha presentado", boldFont);
                addCell(tramTable, processing.presentedAt() != null ? processing.presentedAt().format(DATE_FMT) : "—", normalFont);
                addCell(tramTable, "Derivado a inspección", boldFont);
                addCell(tramTable, processing.inspectionForwardedAt() != null ? processing.inspectionForwardedAt().format(DATE_FMT) : "—", normalFont);
                addCell(tramTable, "Fecha inspección", boldFont);
                addCell(tramTable, processing.inspectionDate() != null ? processing.inspectionDate().format(DATE_FMT) : "—", normalFont);
                addCell(tramTable, "Modalidad", boldFont);
                addCell(tramTable, nvl(processing.modalityCode()), normalFont);
                addCell(tramTable, "Dictamen", boldFont);
                addCell(tramTable, nvl(processing.opinionCode()), normalFont);
                addCell(tramTable, "Mínimo para cierre", boldFont);
                addCell(tramTable, processing.minimumCloseAmount() != null ? CURRENCY_FMT.format(processing.minimumCloseAmount()) : "—", normalFont);
                addCell(tramTable, "Lleva repuestos", boldFont);
                addCell(tramTable, Boolean.TRUE.equals(processing.includesParts()) ? "SI" : "NO", normalFont);
                addCell(tramTable, "Cotización", boldFont);
                addCell(tramTable, nvl(processing.quotationStatusCode()), normalFont);
                addCell(tramTable, "Fecha cotización", boldFont);
                addCell(tramTable, processing.quotationDate() != null ? processing.quotationDate().format(DATE_FMT) : "—", normalFont);
                addCell(tramTable, "Monto acordado", boldFont);
                addCell(tramTable, processing.agreedAmount() != null ? CURRENCY_FMT.format(processing.agreedAmount()) : "—", normalFont);
                addCell(tramTable, "A facturar Cía.", boldFont);
                addCell(tramTable, processing.amountToBillCompany() != null ? CURRENCY_FMT.format(processing.amountToBillCompany()) : "—", normalFont);
                addCell(tramTable, "Provee repuestos", boldFont);
                addCell(tramTable, nvl(processing.partsSupplierText()), normalFont);
                addCell(tramTable, "Final a favor Taller", boldFont);
                addCell(tramTable, processing.finalAmountForWorkshop() != null ? CURRENCY_FMT.format(processing.finalAmountForWorkshop()) : "—", normalFont);
                addCell(tramTable, "Autorización repuestos", boldFont);
                addCell(tramTable, nvl(processing.partsAuthorizationCode()), normalFont);
                document.add(tramTable);
            }

            // Footer
            Paragraph footer = new Paragraph("Documento generado el " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + " — Taller Zapata", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de gestión del trámite", e);
        }
        return out.toByteArray();
    }

    private void addSection(Document document, String title) throws DocumentException {
        Paragraph section = new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(30, 64, 120)));
        section.setSpacingBefore(15);
        section.setSpacingAfter(8);
        document.add(section);

        // underline bar
        PdfPTable bar = new PdfPTable(1);
        bar.setWidthPercentage(100);
        bar.setTotalWidth(document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin());
        PdfPCell barCell = new PdfPCell();
        barCell.setFixedHeight(1.5f);
        barCell.setBorder(Rectangle.NO_BORDER);
        barCell.setBackgroundColor(new Color(30, 64, 120));
        bar.addCell(barCell);
        bar.setSpacingAfter(5);
        document.add(bar);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(4);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new Color(210, 210, 210));
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    private void addField(Document document, String label, String value, boolean wide) throws DocumentException {
        Paragraph lp = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.GRAY));
        lp.setSpacingBefore(8);
        lp.setSpacingAfter(2);
        document.add(lp);

        Paragraph vp = new Paragraph(value != null && !value.isBlank() ? value : "—", FontFactory.getFont(FontFactory.HELVETICA, 10));
        vp.setSpacingAfter(5);
        document.add(vp);
    }

    private String nvl(String value) { return value != null && !value.isBlank() ? value : "—"; }

    private PersonEntity resolveCasePerson(Long caseId, Long casePersonId) {
        if (casePersonId == null) return null;
        return casePersonRepository.findByIdAndCaseId(casePersonId, caseId)
                .flatMap(link -> personRepository.findById(link.getPersonId()))
                .orElse(null);
    }
}
