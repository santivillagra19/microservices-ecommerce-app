# syntax=docker/dockerfile:1
# Temurin Docker tags were not published yet on 2026-10-23. Use the official
# patched binaries with their release checksums instead of an older cached JRE.
# These binaries target linux/amd64 (the local Minikube architecture).
FROM alpine:3.23@sha256:21f3e19bafab57a9ff7aa9dd571dac72f868370472c10f450cc0416cc1aca553 AS runtime
RUN apk add --no-cache ca-certificates fontconfig libstdc++ tzdata
ADD --checksum=sha256:9138eab0f7d230e17163953f015ec9ae2431dbc49069c658b7f991e45b54fb9b https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_alpine-linux_hotspot_21.0.13_9.tar.gz /tmp/java.tar.gz
RUN mkdir -p /opt/java/openjdk \
    && tar -xzf /tmp/java.tar.gz -C /opt/java/openjdk --strip-components=1 \
    && rm /tmp/java.tar.gz \
    && addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"

FROM runtime AS builder
ADD --checksum=sha256:dc453842ee3f24710258f42a95bdfe5c2bfc0ca9d70c12f950ead82aee0c8361 https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jdk_x64_alpine-linux_hotspot_21.0.13_9.tar.gz /tmp/jdk.tar.gz
RUN mkdir -p /opt/java/jdk \
    && tar -xzf /tmp/jdk.tar.gz -C /opt/java/jdk --strip-components=1 \
    && rm /tmp/jdk.tar.gz
ENV JAVA_HOME=/opt/java/jdk
ENV PATH="/opt/java/jdk/bin:${PATH}"
ARG SERVICE
WORKDIR /workspace
COPY pom.xml ./pom.xml
COPY ${SERVICE}/pom.xml ./${SERVICE}/pom.xml
COPY ${SERVICE}/mvnw ./mvnw
COPY ${SERVICE}/.mvn ./.mvn
RUN chmod +x mvnw && ./mvnw -B -ntp -f "${SERVICE}/pom.xml" dependency:go-offline
COPY ${SERVICE}/src ./${SERVICE}/src
RUN ./mvnw -B -ntp -f "${SERVICE}/pom.xml" verify -DskipTests

FROM runtime AS local
ARG SERVICE
WORKDIR /app
# Deployment script uses the exact JAR already verified by the Maven reactor.
COPY --chown=10001:10001 ${SERVICE}/target/*-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

FROM runtime
ARG SERVICE
WORKDIR /app
COPY --from=builder --chown=10001:10001 /workspace/${SERVICE}/target/*-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
