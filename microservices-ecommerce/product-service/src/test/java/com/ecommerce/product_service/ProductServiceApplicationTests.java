package com.ecommerce.product_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
class ProductServiceApplicationTests {

    static final GenericContainer<?> mongodb = new GenericContainer<>(DockerImageName.parse("mongo:8.0"))
            .withExposedPorts(27017)
            .withEnv("MONGO_INITDB_ROOT_USERNAME", "test-user")
            .withEnv("MONGO_INITDB_ROOT_PASSWORD", "test-password");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        mongodb.start();
        properties.add("spring.data.mongodb.host", mongodb::getHost);
        properties.add("spring.data.mongodb.port", () -> mongodb.getMappedPort(27017));
        properties.add("spring.data.mongodb.database", () -> "products-test");
        properties.add("spring.data.mongodb.username", () -> "test-user");
        properties.add("spring.data.mongodb.password", () -> "test-password");
        properties.add("spring.data.mongodb.authentication-database", () -> "admin");
    }

	@Test
	void contextLoads() {
	}

}
