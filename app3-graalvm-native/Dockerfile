# ── Stage 1: Build Native Image ───────────────────────────────────────────────
FROM ghcr.io/graalvm/native-image-community:21 AS build

RUN microdnf install -y maven

WORKDIR /workspace
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src

RUN mvn -Pnative native:compile -DskipTests \
    -Dspring.aot.enabled=true \
    2>&1 | tail -30

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
# ubuntu:22.04 instead of distroless — has required glibc/libstdc++ libs
# Still much smaller than a full JRE image
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libstdc++6 \
    zlib1g \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

LABEL app="app3-graalvm-native"

WORKDIR /app
COPY --from=build /workspace/target/app3-native /app/app3-native
RUN chmod +x /app/app3-native

EXPOSE 8082

ENTRYPOINT ["/app/app3-native"]
