# Renly

## 1. Executive Summary

Renly is a developer-centric CLI tool designed to bridge the gap between local development and production on the Locus PaaS. By automating the "plumbing" of modern web deployment—containerization, port mapping, and build optimization—Renly reduces the time-to-production for developers from hours to seconds.

## 2. Problem Statement

Deploying modern frameworks like Next.js into containerized environments (like Locus/AWS ECS) requires significant boilerplate:

- Configuring Dockerfiles for multi-stage builds.
- Optimizing for "Standalone" mode to reduce image size and RAM usage.
- Manually mapping ports (8080) and environment variables.
- Orchestrating Git-to-platform pipelines.

For early-stage startups, these infrastructure hurdles are a significant drain on velocity.

## 3. The Solution: Renly CLI

Renly provides a "Zero-Config" entry point into the Locus ecosystem:

- **Instant Scaffolding**: One command generates production-ready code with Locus-compatible Dockerfiles.
- **Unified Pipeline**: Connects local Git directly to Locus build workers without requiring manual Dashboard configuration.

## 4. Market Opportunity

- **Developer Velocity**: In the growing "Agentic Economy" and "Hackathon Culture," developers prioritize tools that minimize infrastructure friction.
- **Locus Ecosystem**: As Locus expands, Renly serves as an onboarding ramp for new developers.
- **SaaS Rapid Prototyping**: Ideal for "Solopreneurs" building MVPs quickly.

## 5. Monetization & Growth

- **Freemium CLI**: The core tool is free and open-source to drive Locus adoption.
- **Renly Pro (Subscription)**: Managed "Template Marketplace" for specialized architectures (e.g., Vector DB integration, custom auth layers).
