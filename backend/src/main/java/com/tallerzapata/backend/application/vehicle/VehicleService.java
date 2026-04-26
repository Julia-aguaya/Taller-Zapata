package com.tallerzapata.backend.application.vehicle;

import com.tallerzapata.backend.api.vehicle.VehicleBrandResponse;
import com.tallerzapata.backend.api.vehicle.VehicleModelResponse;
import com.tallerzapata.backend.api.vehicle.VehiclePersonResponse;
import com.tallerzapata.backend.api.vehicle.VehiclePersonUpsertRequest;
import com.tallerzapata.backend.api.vehicle.VehicleResponse;
import com.tallerzapata.backend.api.vehicle.VehicleUpsertRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleBrandEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleBrandRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleModelEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleModelRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehiclePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehiclePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final PersonRepository personRepository;
    private final VehicleBrandRepository vehicleBrandRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final VehiclePersonRepository vehiclePersonRepository;
    private final VehicleRoleRepository vehicleRoleRepository;

    public VehicleService(
            VehicleRepository vehicleRepository,
            PersonRepository personRepository,
            VehicleBrandRepository vehicleBrandRepository,
            VehicleModelRepository vehicleModelRepository,
            VehiclePersonRepository vehiclePersonRepository,
            VehicleRoleRepository vehicleRoleRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.personRepository = personRepository;
        this.vehicleBrandRepository = vehicleBrandRepository;
        this.vehicleModelRepository = vehicleModelRepository;
        this.vehiclePersonRepository = vehiclePersonRepository;
        this.vehicleRoleRepository = vehicleRoleRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> search(String plate, String query) {
        String normalizedPlate = VehiclePlateNormalizer.normalize(plate);
        String normalizedQuery = blankToNull(query);

        if (normalizedPlate != null) {
            return vehicleRepository.findByNormalizedPlate(normalizedPlate)
                    .map(entity -> toResponse(entity))
                    .stream()
                    .toList();
        }

        if (normalizedQuery != null) {
            String normalizedQueryPlate = VehiclePlateNormalizer.normalize(normalizedQuery);
            return vehicleRepository.searchAutocomplete(
                            normalizedQuery.toLowerCase(),
                            normalizedQueryPlate == null ? "" : normalizedQueryPlate,
                            PageRequest.of(0, 50)
                    )
                    .stream()
                    .map(entity -> toResponse(entity))
                    .toList();
        }

        return vehicleRepository.findByActivoTrueOrderByIdDesc(PageRequest.of(0, 50))
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(Long vehicleId) {
        return toResponse(getEntity(vehicleId));
    }

    @Transactional
    public VehicleResponse create(VehicleUpsertRequest request) {
        validatePlateUniqueness(request.plate(), null);

        VehicleEntity entity = new VehicleEntity();
        apply(entity, request);

        return toResponse(vehicleRepository.save(entity));
    }

    @Transactional
    public VehicleResponse update(Long vehicleId, VehicleUpsertRequest request) {
        validatePlateUniqueness(request.plate(), vehicleId);

        VehicleEntity entity = getEntity(vehicleId);
        apply(entity, request);

        return toResponse(vehicleRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<VehicleBrandResponse> listBrands() {
        return vehicleBrandRepository.findByActivoTrueOrderByNombreAsc()
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleModelResponse> listModels(Long brandId) {
        if (brandId == null) {
            return vehicleModelRepository.findByActivoTrueOrderByNombreAsc()
                    .stream()
                    .map(entity -> toResponse(entity))
                    .toList();
        }

        if (!vehicleBrandRepository.existsByIdAndActivoTrue(brandId)) {
            throw new ResourceNotFoundException("No existe la marca de vehiculo " + brandId);
        }

        return vehicleModelRepository.findByBrandIdAndActivoTrueOrderByNombreAsc(brandId)
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehiclePersonResponse> listVehiclePersons(Long vehicleId) {
        ensureVehicleExists(vehicleId);

        return vehiclePersonRepository.findByVehicleIdOrderByEsActualDescIdDesc(vehicleId)
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional
    public VehiclePersonResponse createVehiclePerson(Long vehicleId, VehiclePersonUpsertRequest request) {
        ensureVehicleExists(vehicleId);
        ensurePersonExists(request.personId());

        VehiclePersonEntity entity = new VehiclePersonEntity();
        entity.setVehicleId(vehicleId);
        apply(entity, request);

        return toResponse(vehiclePersonRepository.save(entity));
    }

    @Transactional
    public VehiclePersonResponse updateVehiclePerson(Long vehicleId, Long relationId, VehiclePersonUpsertRequest request) {
        ensureVehicleExists(vehicleId);
        ensurePersonExists(request.personId());

        VehiclePersonEntity entity = vehiclePersonRepository.findByIdAndVehicleId(relationId, vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la relacion " + relationId + " para el vehiculo " + vehicleId));

        apply(entity, request);

        return toResponse(vehiclePersonRepository.save(entity));
    }

    private VehicleEntity getEntity(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el vehiculo " + vehicleId));
    }

    private void ensureVehicleExists(Long vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("No existe el vehiculo " + vehicleId);
        }
    }

    private void ensurePersonExists(Long personId) {
        if (!personRepository.existsById(personId)) {
            throw new ResourceNotFoundException("No existe la persona " + personId);
        }
    }

    private void validatePlateUniqueness(String plate, Long vehicleId) {
        String normalizedPlate = VehiclePlateNormalizer.normalize(plate);
        if (normalizedPlate == null) {
            return;
        }

        boolean exists = vehicleId == null
                ? vehicleRepository.existsByNormalizedPlate(normalizedPlate)
                : vehicleRepository.existsByNormalizedPlateAndIdNot(normalizedPlate, vehicleId);

        if (exists) {
            throw new ConflictException("Ya existe un vehiculo con ese dominio");
        }
    }

    private void apply(VehicleEntity entity, VehicleUpsertRequest request) {
        entity.setBrandId(request.brandId());
        entity.setModelId(request.modelId());
        entity.setBrandText(blankToNull(request.brandText()));
        entity.setModelText(blankToNull(request.modelText()));
        entity.setPlate(blankToNull(request.plate()));
        entity.setNormalizedPlate(VehiclePlateNormalizer.normalize(request.plate()));
        entity.setYear(request.year());
        entity.setVehicleTypeCode(blankToNull(request.vehicleTypeCode()));
        entity.setUsageCode(blankToNull(request.usageCode()));
        entity.setColor(blankToNull(request.color()));
        entity.setPaintCode(blankToNull(request.paintCode()));
        entity.setChasis(blankToNull(request.chasis()));
        entity.setMotor(blankToNull(request.motor()));
        entity.setTransmissionCode(blankToNull(request.transmissionCode()));
        entity.setMileage(request.mileage());
        entity.setObservaciones(blankToNull(request.observaciones()));
        entity.setActivo(request.activo() == null ? true : request.activo());
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void apply(VehiclePersonEntity entity, VehiclePersonUpsertRequest request) {
        validateDateRange(request);
        String roleCode = normalizeCode(request.rolVehiculoCodigo());
        validateVehicleRoleCode(roleCode);

        entity.setPersonId(request.personId());
        entity.setRolVehiculoCodigo(roleCode);
        entity.setEsActual(request.esActual() == null ? true : request.esActual());
        entity.setDesde(request.desde());
        entity.setHasta(request.hasta());
        entity.setNotas(blankToNull(request.notas()));
    }

    private VehicleResponse toResponse(VehicleEntity entity) {
        return new VehicleResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getBrandId(),
                entity.getModelId(),
                entity.getBrandText(),
                entity.getModelText(),
                entity.getPlate(),
                entity.getNormalizedPlate(),
                entity.getYear(),
                entity.getVehicleTypeCode(),
                entity.getUsageCode(),
                entity.getColor(),
                entity.getPaintCode(),
                entity.getChasis(),
                entity.getMotor(),
                entity.getTransmissionCode(),
                entity.getMileage(),
                entity.getObservaciones(),
                entity.getActivo()
        );
    }

    private VehicleBrandResponse toResponse(VehicleBrandEntity entity) {
        return new VehicleBrandResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getActivo()
        );
    }

    private VehicleModelResponse toResponse(VehicleModelEntity entity) {
        return new VehicleModelResponse(
                entity.getId(),
                entity.getBrandId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getActivo()
        );
    }

    private VehiclePersonResponse toResponse(VehiclePersonEntity entity) {
        return new VehiclePersonResponse(
                entity.getId(),
                entity.getVehicleId(),
                entity.getPersonId(),
                entity.getRolVehiculoCodigo(),
                entity.getEsActual(),
                entity.getDesde(),
                entity.getHasta(),
                entity.getNotas()
        );
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }

    private void validateVehicleRoleCode(String roleCode) {
        if (roleCode == null || !vehicleRoleRepository.existsByCodeAndActiveTrue(roleCode)) {
            throw new ConflictException("rolVehiculoCodigo no permitido: " + roleCode);
        }
    }

    private void validateDateRange(VehiclePersonUpsertRequest request) {
        if (request.desde() != null && request.hasta() != null && request.hasta().isBefore(request.desde())) {
            throw new ConflictException("La fecha 'hasta' no puede ser anterior a 'desde'");
        }
    }
}
