import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand, setupRootConcurrentDev } from '../../utils.js';

export async function setupSpringBoot(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Spring Boot)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `Spring Boot backend for ${projectName}`,
    scripts: {
      build: 'mvn clean package -DskipTests',
      start: 'java -jar target/*.jar --server.port=3000',
      dev: 'mvn spring-boot:run'
    },
    main: 'src/main/java/com/example/Application.java'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  let result = shell.exec('mvn -q archetype:generate -DgroupId=com.example -DartifactId=backend -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to generate Spring Boot project');

  // Create enhanced pom.xml with Spring Boot and CORS support
  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>${projectName}-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;
  fs.writeFileSync(path.join(backendDir, 'pom.xml'), pomXml);
  console.log('↳ Created Spring Boot pom.xml');

  const appJavaDir = path.join(backendDir, 'src', 'main', 'java', 'com', 'example');
  fs.mkdirSync(appJavaDir, { recursive: true });
  
  // Create enhanced Application.java with CORS support
  const appJava = `package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Map;

@SpringBootApplication
@RestController
public class Application {
    
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
            "message", "Hello from ${projectName} Spring Boot backend",
            "status", "running"
        );
    }
    
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "healthy");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}`;
  fs.writeFileSync(path.join(appJavaDir, 'Application.java'), appJava);
  console.log('↳ Created Application.java with CORS support');

  // Update root package.json for concurrent development
  setupRootConcurrentDev(targetDir);
}
