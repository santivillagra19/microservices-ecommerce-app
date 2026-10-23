# syntax=docker/dockerfile:1
FROM quay.io/keycloak/keycloak:26.8.1@sha256:79c623a22abacf3fe6c00a5fb30f5b7843d717b234033b80995891c06116d244 AS distribution

# Copy the application, without retaining the vulnerable OS and unused old JRE.
# This custom linux/amd64 runtime is validated against a restored database first.
FROM alpine:3.23@sha256:21f3e19bafab57a9ff7aa9dd571dac72f868370472c10f450cc0416cc1aca553
RUN apk add --no-cache bash ca-certificates fontconfig libstdc++ tzdata \
    && addgroup -S -g 1000 keycloak && adduser -S -u 1000 -G keycloak keycloak
ADD --checksum=sha256:9138eab0f7d230e17163953f015ec9ae2431dbc49069c658b7f991e45b54fb9b https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_alpine-linux_hotspot_21.0.13_9.tar.gz /tmp/java.tar.gz
RUN mkdir -p /opt/java/openjdk \
    && tar -xzf /tmp/java.tar.gz -C /opt/java/openjdk --strip-components=1 \
    && rm /tmp/java.tar.gz
COPY --from=distribution --chown=1000:1000 /opt/keycloak /opt/keycloak
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"
ENV KC_RUN_IN_CONTAINER=true
ENV LANG=C.UTF-8
WORKDIR /opt/keycloak
USER 1000:1000
EXPOSE 8080 8443 9000
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
