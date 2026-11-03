package com.tallerzapata.backend.application.budget;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@Service
public class PartLabelPdfService {

    private final CasePartRepository casePartRepository;
    private final CaseRepository caseRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;

    public PartLabelPdfService(CasePartRepository casePartRepository, CaseRepository caseRepository,
                               CurrentUserService currentUserService,
                               CaseAccessControlService caseAccessControlService) {
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
    }

    public byte[] generate(Long caseId, Long partId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.ver");
        CasePartEntity part = casePartRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ResourceNotFoundException("El repuesto no pertenece al caso");

        String folderIdentifier = caseEntity.getFolderCode();
        String partIdentifier = "REP-" + part.getId();
        int orderedQuantity = part.getOrderedQuantity() == null ? 1 : part.getOrderedQuantity();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(new Rectangle(280, 200), 15, 15, 10, 10);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font identifierFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY);

            Paragraph title = new Paragraph("ETIQUETA DE REPUESTO", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("Carpeta: " + folderIdentifier, normalFont));

            Paragraph identifier = new Paragraph(partIdentifier, identifierFont);
            identifier.setAlignment(Element.ALIGN_CENTER);
            document.add(identifier);

            document.add(new Paragraph(part.getDescription(), normalFont));
            document.add(new Paragraph("Cantidad del item: " + orderedQuantity + (orderedQuantity == 1 ? " unidad" : " unidades"), smallFont));

            Paragraph footer = new Paragraph("Taller Zapata", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar etiqueta", e);
        }
        return out.toByteArray();
    }
}
