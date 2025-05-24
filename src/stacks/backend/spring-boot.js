import path from 'path';
import fs from 'fs';
import shell from 'shelljs';

export async function setupSpringBoot(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Spring Boot)...');
  fs.mkdirSync(backendDir, { recursive: true });

  shell.exec('mvn -q archetype:generate -DgroupId=com.example -DartifactId=backend -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false', { cwd: backendDir, silent: true });

  const appJavaDir = path.join(backendDir, 'src', 'main', 'java', 'com', 'example');
  fs.mkdirSync(appJavaDir, { recursive: true });
  const appJava = `package com.example;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\nimport org.springframework.web.bind.annotation.GetMapping;\nimport org.springframework.web.bind.annotation.RestController;\n\n@SpringBootApplication\n@RestController\npublic class Application {\n    public static void main(String[] args) {\n        SpringApplication.run(Application.class, args);\n    }\n\n    @GetMapping("/")\n    public String home() {\n        return "Hello from Spring Boot!";\n    }\n}`;
  fs.writeFileSync(path.join(appJavaDir, 'Application.java'), appJava);
}
