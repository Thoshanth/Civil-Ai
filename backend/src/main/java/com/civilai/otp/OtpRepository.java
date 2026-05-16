package com.civilai.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, UUID> {

    Optional<OtpEntity> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String email, OtpPurpose purpose
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpEntity o WHERE o.email = :email AND o.purpose = :purpose")
    void deleteAllByEmailAndPurpose(String email, OtpPurpose purpose);
}
