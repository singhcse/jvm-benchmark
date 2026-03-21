# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.8.8-eclipse-temurin-8 AS build
WORKDIR /workspace
COPY pom.xml .
# Download dependencies first (Docker layer cache)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:8-jre-alpine
LABEL maintainer="benchmark"
LABEL app="app1-java8-g1gc"
LABEL description="Traditional JVM: Java 8 + HotSpot JIT + G1GC + Platform Threads"

WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar

# GC logging directory
RUN mkdir -p /logs

# Expose app port + JMX (optional remote profiling)
EXPOSE 8080

# JVM flags:
#   -server              → use server VM (enables C2 JIT compiler)
#   -XX:+UseG1GC         → use G1 Garbage Collector
#   -XX:MaxGCPauseMillis → target GC pause goal (not a hard limit)
#   -XX:G1HeapRegionSize → tune region size for our heap size
#   -Xms / -Xmx         → fixed heap (avoids resizing cost)
#   -XX:+TieredCompilation → use both C1 (fast) and C2 (optimized) JIT
#   -Xlog:gc*            → GC logs (Java 9+ syntax; on Java 8 use -verbose:gc)
ENV JAVA_OPTS="\
  -server \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:G1HeapRegionSize=8m \
  -Xms256m \
  -Xmx512m \
  -XX:+TieredCompilation \
  -verbose:gc \
  -XX:+PrintGCDetails \
  -XX:+PrintGCDateStamps \
  -Xloggc:/logs/gc-app1.log"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
