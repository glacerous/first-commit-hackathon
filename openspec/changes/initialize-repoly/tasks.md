# Tasks: Initialize Repoly (Infra-Aligned)

## 1. Preparation
- [ ] Read and extract domain from `domain.txt` <!-- id: 1.1 -->
- [ ] Read and extract credentials from `db-credentials.txt` <!-- id: 1.2 -->
- [ ] Verify `kubeconfig.yaml` access <!-- id: 1.3 -->

## 2. Dockerization
- [ ] Dockerize `apps/api` <!-- id: 2.1 -->
- [ ] Dockerize `apps/worker` <!-- id: 2.2 -->
- [ ] Dockerize `apps/web` <!-- id: 2.3 -->

## 3. Kubernetes Deployment
- [ ] Create Namespace-aware K8s Deployment for API <!-- id: 3.1 -->
- [ ] Create Namespace-aware K8s Deployment for Worker <!-- id: 3.2 -->
- [ ] Create Namespace-aware K8s Deployment for Web <!-- id: 3.3 -->
- [ ] Setup Ingress using domain from `domain.txt` <!-- id: 3.4 -->

## 4. Verification
- [ ] Run `kubectl get pods` to verify health <!-- id: 4.1 -->
- [ ] Verify database connectivity from API <!-- id: 4.2 -->
- [ ] Verify public access via hackathon domain <!-- id: 4.3 -->
