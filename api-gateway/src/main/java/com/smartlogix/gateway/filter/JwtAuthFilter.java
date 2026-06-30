package com.smartlogix.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.List;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secret;

    // rutas publicas que no requieren token
    private static final List<String> PUBLIC_PATHS = List.of(
            "/auth/login",
            "/auth/register",
            "/actuator",
            "/api/orders/coupons/validate"
    );

    // rutas solo para admin
    private static final List<String> ADMIN_ONLY_PATHS = List.of(
            "/api/inventory/items/admin"
    );

    // rutas para admin y warehouse
    private static final List<String> ADMIN_WAREHOUSE_PATHS = List.of(
            "/api/inventory/items/manage"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        // dejar pasar rutas publicas
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return reject(exchange, HttpStatus.UNAUTHORIZED);
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = parseClaims(token);
            String role = (String) claims.get("role");
            String username = claims.getSubject();

            // solo admin puede hacer POST/PUT/DELETE en inventario (excepto reserve/release que es del flujo de compra)
            if (isWriteOnInventory(path, method) && !isAdminOrWarehouse(role)) {
                return reject(exchange, HttpStatus.FORBIDDEN);
            }

            // propagamos usuario y rol como headers internos para los microservicios
            ServerWebExchange mutated = exchange.mutate()
                    .request(r -> r.header("X-User", username).header("X-Role", role))
                    .build();

            return chain.filter(mutated);

        } catch (Exception e) {
            return reject(exchange, HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    // operaciones de escritura en inventario requieren admin o warehouse
    private boolean isWriteOnInventory(String path, String method) {
        boolean isInventory = path.startsWith("/api/inventory/items");
        boolean isWrite = method.equals("POST") || method.equals("PUT") || method.equals("DELETE") || method.equals("PATCH");
        boolean isStockOp = path.contains("/reserve") || path.contains("/release") || path.contains("/dispatch");
        return isInventory && isWrite && !isStockOp;
    }

    private boolean isAdminOrWarehouse(String role) {
        return "ROLE_ADMIN".equals(role) || "ROLE_WAREHOUSE".equals(role);
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getKey() {
        byte[] bytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(bytes);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
