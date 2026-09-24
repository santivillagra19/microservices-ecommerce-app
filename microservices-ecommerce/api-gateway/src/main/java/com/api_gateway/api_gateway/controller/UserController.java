package com.api_gateway.api_gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.url:http://keycloak:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:ecommerce-realm}")
    private String targetRealm;

    private final WebClient webClient;

    public UserController() {
        this.webClient = WebClient.create();
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<String>> registerUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String password = request.get("password");
        String firstName = request.getOrDefault("firstName", username);
        String lastName = request.getOrDefault("lastName", "User");

        // 1. Obtener Token de Admin de Keycloak
        MultiValueMap<String, String> tokenRequest = new LinkedMultiValueMap<>();
        tokenRequest.add("client_id", "admin-cli");
        tokenRequest.add("username", adminUsername);
        tokenRequest.add("password", adminPassword);
        tokenRequest.add("grant_type", "password");

        return webClient.post()
                .uri(keycloakUrl + "/realms/master/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(tokenRequest))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(tokenResponse -> {
                    String adminToken = (String) tokenResponse.get("access_token");

                    // 2. Armar el JSON del nuevo usuario
                    Map<String, Object> userJson = Map.of(
                            "username", username,
                            "email", email,
                            "firstName", firstName,
                            "lastName", lastName,
                            "enabled", true,
                            "emailVerified", true,
                            "credentials", List.of(
                                    Map.of(
                                            "type", "password",
                                            "value", password,
                                            "temporary", false
                                    )
                            )
                    );

                    // 3. Crear el usuario en Keycloak usando la Admin API
                    return webClient.post()
                            .uri(keycloakUrl + "/admin/realms/" + targetRealm + "/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(userJson)
                            .retrieve()
                            .toBodilessEntity()
                            .map(response -> ResponseEntity.status(response.getStatusCode()).body("Usuario registrado con exito"))
                            .onErrorResume(e -> {
                                System.err.println("Error creando usuario en Keycloak: " + e.getMessage());
                                if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
                                    org.springframework.web.reactive.function.client.WebClientResponseException webEx = (org.springframework.web.reactive.function.client.WebClientResponseException) e;
                                    if (webEx.getStatusCode() == HttpStatus.CONFLICT) {
                                        return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).body("El usuario ya existe."));
                                    }
                                }
                                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body("Error creando usuario."));
                            });
                })
                .onErrorResume(e -> {
                    System.err.println("Error obteniendo token de Admin de Keycloak: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error interno al autenticar con el servidor de identidades."));
                });
    }
}
