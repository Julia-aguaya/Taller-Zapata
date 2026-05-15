package com.tallerzapata.backend.infrastructure.persistence.reference;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReferralContactRepository extends JpaRepository<ReferralContactEntity, Long> {

    @Query("""
            select r from ReferralContactEntity r
            where (:queryText = '' or lower(r.name) like concat('%', :queryText, '%') or lower(coalesce(r.email, '')) like concat('%', :queryText, '%') or lower(coalesce(r.phone, '')) like concat('%', :queryText, '%'))
            and r.active = true
            order by r.name asc
            """)
    List<ReferralContactEntity> searchAutocomplete(@Param("queryText") String queryText, Pageable pageable);

    List<ReferralContactEntity> findByActiveTrueOrderByNameAsc(Pageable pageable);
}
