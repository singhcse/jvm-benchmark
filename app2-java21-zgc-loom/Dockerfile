# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
LABEL app="app2-java21-zgc-loom"
LABEL description="Modern JVM: Java 21 + ZGC Generational + Virtual Threads (Loom) + JIT"

WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
RUN mkdir -p /logs

EXPOSE 8081

# JVM flags:
#   -XX:+UseZGC              → Z Garbage Collector (concurrent, low pause)
#   -XX:+ZGenerational       → Generational ZGC (Java 21+, better throughput)
#   -Xms128m / -Xmx512m      → lower initial heap vs App1; ZGC handles growth well
#   -Dspring.threads.virtual → tells Spring to use virtual threads globally
#   No -verbose:gc needed    → ZGC pauses are so short they're rarely worth logging
ENV JAVA_OPTS="\
  -XX:+UseZGC \
  -XX:+ZGenerational \
  -Xms128m \
  -Xmx512m \
  -Dspring.threads.virtual.enabled=true \
  -XX:+FlightRecorder \
  -Xlog:gc*:file=/logs/gc-app2.log"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
