---
description: How to deploy the Repoly application (API, Web, Worker) to Kubernetes
---

# Deploying Repoly to Kubernetes

Follow these steps to deploy or update the Repoly application in the Kubernetes cluster.

## 1. Prerequisites

Ensure the following Secrets and ConfigMaps are present in the `first-commit` namespace:

- **ConfigMaps**: `app-config-api`, `app-config-web`, `app-config-worker` (or a global `app-config`).
- **Secrets**:
    - `api-keys`: Must contain `groq-api-key` and `github-token`.
    - `db-credentials`: Must contain `database-url` and `pg-password`.

## 2. Deploying Components

Since the current service account has limited `patch` permissions, use `kubectl replace` instead of `kubectl apply` for updates.

### Option A: Deploy everything at once
```bash
kubectl replace -f k8s/deployment.yaml
```
*Note: This might fail if the file contains resources you don't have permission to modify (like Ingress). If so, use Option B.*

### Option B: Deploy component by component
Use a helper script or `awk` to extract and apply only the Deployments:

```bash
# Apply API
awk 'BEGIN {RS="---"} /kind: Deployment/ && /name: api/ {print "---"$0}' k8s/deployment.yaml | kubectl replace -f -

# Apply Worker
awk 'BEGIN {RS="---"} /kind: Deployment/ && /name: worker/ {print "---"$0}' k8s/deployment.yaml | kubectl replace -f -

# Apply Web
awk 'BEGIN {RS="---"} /kind: Deployment/ && /name: web/ {print "---"$0}' k8s/deployment.yaml | kubectl replace -f -
```

## 3. Verify Deployment

Check the status of the pods:
```bash
kubectl get pods
```

Monitor logs for any issues:
```bash
kubectl logs -l app=api --tail=50
kubectl logs -l app=worker --tail=50
kubectl logs -l app=web --tail=50
```

## 4. Troubleshooting

- **CrashLoopBackOff (Web)**: If the web pod crashes with "Could not find a production build", ensure the `command` override in `deployment.yaml` correctly locates the `.next` folder inside the monorepo structure.
- **Authentication Failed (Worker/API)**: Ensure `PGPASSWORD` or `DATABASE_URL` is correctly set in the `db-credentials` secret.
