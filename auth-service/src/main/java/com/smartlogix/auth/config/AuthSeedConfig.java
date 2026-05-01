package com.smartlogix.auth.config;

import com.smartlogix.auth.domain.Role;
import com.smartlogix.auth.domain.User;
import com.smartlogix.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AuthSeedConfig {

    @Bean
    CommandLineRunner authSeeder(UserRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.save(buildUser("cliente@ejemplo.com", "1234", Role.ROLE_USER, passwordEncoder));
            repository.save(buildUser("admin@smartlogix.com", "admin123", Role.ROLE_ADMIN, passwordEncoder));
            repository.save(buildUser("bodega@smartlogix.com", "bodega123", Role.ROLE_WAREHOUSE, passwordEncoder));
        };
    }

    private User buildUser(String username, String password, Role role, PasswordEncoder encoder) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        return user;
    }
}
