package com.tallerzapata.backend.application.reference;

import com.tallerzapata.backend.api.reference.ReferralContactResponse;
import com.tallerzapata.backend.api.reference.ReferralContactUpsertRequest;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.reference.ReferralContactEntity;
import com.tallerzapata.backend.infrastructure.persistence.reference.ReferralContactRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReferralContactService {

    private final ReferralContactRepository referralContactRepository;

    public ReferralContactService(ReferralContactRepository referralContactRepository) {
        this.referralContactRepository = referralContactRepository;
    }

    @Transactional(readOnly = true)
    public List<ReferralContactResponse> search(String query) {
        String normalizedQuery = blankToNull(query);
        if (normalizedQuery == null) {
            return referralContactRepository.findByActiveTrueOrderByNameAsc(PageRequest.of(0, 100))
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return referralContactRepository.searchAutocomplete(normalizedQuery.toLowerCase(), PageRequest.of(0, 100))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReferralContactResponse create(ReferralContactUpsertRequest request) {
        ReferralContactEntity entity = new ReferralContactEntity();
        apply(entity, request);
        return toResponse(referralContactRepository.save(entity));
    }

    @Transactional
    public ReferralContactResponse update(Long referralId, ReferralContactUpsertRequest request) {
        ReferralContactEntity entity = referralContactRepository.findById(referralId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el referenciado " + referralId));
        apply(entity, request);
        return toResponse(referralContactRepository.save(entity));
    }

    private void apply(ReferralContactEntity entity, ReferralContactUpsertRequest request) {
        entity.setName(request.name().trim());
        entity.setPhone(blankToNull(request.phone()));
        entity.setEmail(blankToNull(request.email()));
        entity.setNotes(blankToNull(request.notes()));
        entity.setActive(request.active() == null || request.active());
    }

    private ReferralContactResponse toResponse(ReferralContactEntity entity) {
        return new ReferralContactResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getName(),
                entity.getPhone(),
                entity.getEmail(),
                entity.getNotes(),
                entity.getActive()
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
