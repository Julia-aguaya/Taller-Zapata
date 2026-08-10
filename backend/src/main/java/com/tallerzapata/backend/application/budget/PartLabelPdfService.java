package com.tallerzapata.backend.application.budget;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PartLabelPdfService {

    private final CasePartRepository casePartRepository;
    private final CaseRepository caseRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;

    public PartLabelPdfService(CasePartRepository casePartRepository, CaseRepository caseRepository,
                                PersonRepository personRepository, VehicleRepository vehicleRepository) {
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public byte[] generate(Long caseId, Long partId) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        CasePartEntity part = casePartRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ResourceNotFoundException("El repuesto no pertenece al caso");

        PersonEntity customer = caseEntity.getPrincipalCustomerPersonId() != null
                ? personRepository.findById(caseEntity.getPrincipalCustomerPersonId()).orElse(null) : null;
        VehicleEntity vehicle = caseEntity.getPrincipalVehicleId() != null
                ? vehicleRepository.findById(caseEntity.getPrincipalVehicleId()).orElse(null) : null;

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(new Rectangle(280, 200), 15, 15, 10, 10);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font bigFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7, Color.GRAY);

            // Cliente
            document.add(new Paragraph(customer != null ? customer.getNombreMostrar() : "—", titleFont));
            // Vehículo
            document.add(new Paragraph(vehicle != null ? vehicle.getPlate() + " — " + (vehicle.getBrandText() != null ? vehicle.getBrandText() + " " : "") + (vehicle.getModelText() != null ? vehicle.getModelText() : "") : "—", normalFont));
            document.add(new Paragraph(" "));

            // Nº Inventario
            Paragraph inv = new Paragraph(part.getInventoryNumber() != null ? part.getInventoryNumber() : "S/N", bigFont);
            inv.setAlignment(Element.ALIGN_CENTER);
            document.add(inv);
            document.add(new Paragraph(" "));

            // Descripción
            document.add(new Paragraph(part.getDescription(), normalFont));
            document.add(new Paragraph(" "));

            // Fecha recibido
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 2});
            PdfPCell labelCell = new PdfPCell(new Phrase("Recibido:", smallFont));
            labelCell.setBorder(Rectangle.NO_BORDER);
            table.addCell(labelCell);
            PdfPCell dateCell = new PdfPCell(new Phrase("___/___/_____", normalFont));
            dateCell.setBorder(Rectangle.BOTTOM);
            dateCell.setBorderColor(Color.LIGHT_GRAY);
            table.addCell(dateCell);
            document.add(table);

            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("Taller Zapata — " + (caseEntity.getFolderCode() != null ? caseEntity.getFolderCode() : ""), smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar etiqueta", e);
        }
        return out.toByteArray();
    }
}
