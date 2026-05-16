package com.civilai.user;

import com.civilai.auth.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserDTO getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isVerified(),
                user.getCreatedAt()
        );
    }
}
