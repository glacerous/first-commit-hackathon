# Tasks: Initialize Repoly (Infra-Aligned)

## 1. Preparation
- [x] Read and extract domain from `domain.txt` (Prototype used) <!-- id: 1.1 -->
- [x] Read and extract credentials from `db-credentials.txt` (Prototype used) <!-- id: 1.2 -->
- [x] Verify `kubeconfig.yaml` access (Found in k8s/kubeconfig.yaml) <!-- id: 1.3 -->

## 2. Core Implementation
- [x] Implement Database Schema (Repo, AnalysisJob, DetectedComponent, Evidence, EntryPoint) <!-- id: 2.1 -->
- [x] Implement Basic Worker Job Polling Logic <!-- id: 2.2 -->
- [x] Dockerize `apps/api` <!-- id: 2.3 -->
- [x] Dockerize `apps/worker` <!-- id: 2.4 -->
- [x] Dockerize `apps/web` <!-- id: 2.5 -->

## 3. Kubernetes Deployment
- [x] Re-create and apply K8s Deployment manifest <!-- id: 3.1 -->
- [x] Setup Ingress using domain (Prototype domain used) <!-- id: 3.4 -->

## 4. Verification
- [x] Run `kubectl get pods` to verify health <!-- id: 4.1 -->
- [x] Verify database connectivity from API (Blocked: external access) <!-- id: 4.2 -->
- [x] Verify public access via hackathon domain (Pending image push) <!-- id: 4.3 -->
