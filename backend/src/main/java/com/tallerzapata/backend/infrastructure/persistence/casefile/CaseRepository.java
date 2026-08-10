package com.tallerzapata.backend.infrastructure.persistence.casefile;

import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CaseEntity c where c.id = :caseId")
    Optional<CaseEntity> findByIdForUpdate(Long caseId);

    @Query("""
        select c from CaseEntity c join CaseTypeEntity t on t.id = c.caseTypeId
        where upper(trim(t.code)) = 'PARTICULAR'
        order by c.id asc
        """)
    List<CaseEntity> findParticularCasesOrderByIdAsc();

    @Query("""
        select c from CaseEntity c join CaseTypeEntity t on t.id = c.caseTypeId
        where upper(trim(t.code)) = 'TODO_RIESGO'
        order by c.id asc
        """)
    List<CaseEntity> findTodoRiesgoCasesOrderByIdAsc();

    @Query("select coalesce(max(c.orderNumber), 0) from CaseEntity c where c.organizationId = :organizationId")
    Long findMaxOrderNumberByOrganizationId(Long organizationId);

    List<CaseEntity> findAllByOrderByIdDesc(Pageable pageable);

    @Query("""
        select c
        from CaseEntity c
        left join PersonEntity p on c.principalCustomerPersonId = p.id
        left join VehicleEntity v on c.principalVehicleId = v.id
        where (
          lower(c.folderCode) like concat('%', :queryText, '%')
          or concat('', c.orderNumber) like concat('%', :queryText, '%')
          or lower(coalesce(p.nombreMostrar, '')) like concat('%', :queryText, '%')
          or (:normalizedDocument <> '' and coalesce(p.numeroDocumentoNormalizado, '') like concat('%', :normalizedDocument, '%'))
          or lower(coalesce(v.plate, '')) like concat('%', :queryText, '%'))
        order by c.id desc
        """)
    List<CaseEntity> searchAutocomplete(
        @Param("queryText") String queryText,
        @Param("normalizedDocument") String normalizedDocument,
        Pageable pageable
    );
}
