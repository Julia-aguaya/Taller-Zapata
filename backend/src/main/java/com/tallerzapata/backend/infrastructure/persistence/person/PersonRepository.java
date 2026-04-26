package com.tallerzapata.backend.infrastructure.persistence.person;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<PersonEntity, Long> {

    Optional<PersonEntity> findByNumeroDocumentoNormalizado(String numeroDocumentoNormalizado);

    boolean existsByTipoDocumentoCodigoAndNumeroDocumentoNormalizadoAndIdNot(
            String tipoDocumentoCodigo,
            String numeroDocumentoNormalizado,
            Long id
    );

    boolean existsByTipoDocumentoCodigoAndNumeroDocumentoNormalizado(
            String tipoDocumentoCodigo,
            String numeroDocumentoNormalizado
    );

    List<PersonEntity> findByActivoTrueOrderByIdDesc(Pageable pageable);

    @Query("""
            select p
            from PersonEntity p
            where p.activo = true
              and (
                lower(p.nombreMostrar) like concat('%', :queryText, '%')
                or (:normalizedDocument <> '' and p.numeroDocumentoNormalizado like concat('%', :normalizedDocument, '%'))
              )
            order by p.id desc
            """)
    List<PersonEntity> searchAutocomplete(
            @Param("queryText") String queryText,
            @Param("normalizedDocument") String normalizedDocument,
            Pageable pageable
    );
}
