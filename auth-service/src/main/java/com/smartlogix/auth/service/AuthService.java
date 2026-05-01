package com.smartlogix.auth.service;

import com.smartlogix.auth.domain.User;
import com.smartlogix.auth.repository.UserRepository;
import com.smartlogix.auth.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("User already exists");
        }
        if (user.getRole() == null) {
            user.setRole(com.smartlogix.auth.domain.Role.ROLE_USER);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return "User created successfully";
    }

    public String verifyAndGenerateToken(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return jwtUtil.generateToken(username, userOpt.get().getRole().name());
        }
        throw new RuntimeException("Invalid credentials");
    }
}
