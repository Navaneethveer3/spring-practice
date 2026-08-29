FROM eclipse-temurin:17-jre

RUN mvn run build -DskipTests

COPY target/test-0.0.1-SNAPSHOT.jar /app/test-0.0.1-SNAPSHOT.jar



ENTRYPOINT ["java", "-jar", "/app/test-0.0.1-SNAPSHOT.jar"]

