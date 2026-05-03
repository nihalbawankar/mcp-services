from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI(title="MCP Control Plane", version="1.0.0")

registered_models = {}

DEFAULT_NAMESPACE = os.getenv("NAMESPACE", "mcp-platform")
AWS_REGION        = os.getenv("AWS_REGION", "ap-northeast-1")
CLUSTER_NAME      = os.getenv("CLUSTER_NAME", "mcp-platform-dev")


# ── Kubernetes client (in-cluster) ────────────────────────────
def get_k8s():
    from kubernetes import client, config
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()
    return client


# ── Models ────────────────────────────────────────────────────
class ModelRegistration(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: str
    model_name: str
    version: str
    endpoint: str
    description: Optional[str] = ""
    tags: Optional[list] = []


# ── Health ────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "service": "mcp-control-plane"}


# ── Namespaces ────────────────────────────────────────────────
@app.get("/namespaces")
def list_namespaces():
    try:
        k8s = get_k8s()
        v1  = k8s.CoreV1Api()
        nss = v1.list_namespace()
        return {
            "namespaces": [n.metadata.name for n in nss.items],
            "default": DEFAULT_NAMESPACE,
        }
    except Exception as e:
        return {"namespaces": [DEFAULT_NAMESPACE], "default": DEFAULT_NAMESPACE, "error": str(e)}


# ── Model registry ────────────────────────────────────────────
@app.post("/models/register")
def register_model(model: ModelRegistration):
    registered_models[model.model_id] = model.dict()
    return {"message": "Model registered", "model_id": model.model_id}


@app.get("/models")
def list_models():
    return {"models": list(registered_models.values())}


@app.get("/models/{model_id}")
def get_model(model_id: str):
    if model_id not in registered_models:
        raise HTTPException(status_code=404, detail="Model not found")
    return registered_models[model_id]


@app.delete("/models/{model_id}")
def deregister_model(model_id: str):
    registered_models.pop(model_id, None)
    return {"message": "Model deregistered", "model_id": model_id}


# ── EKS cluster info (boto3) ──────────────────────────────────
def get_eks_info():
    try:
        import boto3
        eks = boto3.client("eks", region_name=AWS_REGION)
        cluster = eks.describe_cluster(name=CLUSTER_NAME)["cluster"]
        return {
            "name":    cluster["name"],
            "status":  cluster["status"],
            "version": cluster["version"],
            "region":  AWS_REGION,
        }
    except Exception as e:
        return {
            "name":    CLUSTER_NAME,
            "status":  "Unknown",
            "version": "N/A",
            "region":  AWS_REGION,
            "error":   str(e),
        }


# ── Pod info (K8s API) ────────────────────────────────────────
def get_pods(namespace: str):
    try:
        k8s = get_k8s()
        v1  = k8s.CoreV1Api()
        pods = v1.list_namespaced_pod(namespace=namespace)
        result = []
        for p in pods.items:
            container = p.spec.containers[0] if p.spec.containers else None
            result.append({
                "name":      p.metadata.name,
                "service":   p.metadata.labels.get("app", "unknown"),
                "status":    p.status.phase or "Unknown",
                "namespace": p.metadata.namespace,
                "restarts":  sum(
                    cs.restart_count
                    for cs in (p.status.container_statuses or [])
                ),
                "node":  p.spec.node_name or "unknown",
                "age":   str(p.metadata.creation_timestamp),
                "image": container.image if container else "unknown",
            })
        return result
    except Exception as e:
        return [{"error": str(e)}]


# ── Node info (K8s API) ───────────────────────────────────────
def get_nodes():
    try:
        k8s = get_k8s()
        v1   = k8s.CoreV1Api()
        nodes = v1.list_node()
        result = []
        for n in nodes.items:
            conditions = {c.type: c.status for c in (n.status.conditions or [])}
            result.append({
                "name":     n.metadata.name,
                "status":   "Ready" if conditions.get("Ready") == "True" else "NotReady",
                "instance": n.metadata.labels.get("node.kubernetes.io/instance-type", "unknown"),
                "zone":     n.metadata.labels.get("topology.kubernetes.io/zone", "unknown"),
                "kubelet":  n.status.node_info.kubelet_version if n.status.node_info else "unknown",
            })
        return result
    except Exception as e:
        return [{"error": str(e)}]


# ── Resource usage (K8s metrics) ─────────────────────────────
def get_resource_metrics(namespace: str):
    try:
        k8s    = get_k8s()
        custom = k8s.CustomObjectsApi()
        metrics = custom.list_namespaced_custom_object(
            group="metrics.k8s.io", version="v1beta1",
            namespace=namespace, plural="pods"
        )
        total_cpu = 0
        total_mem = 0
        for item in metrics.get("items", []):
            for c in item.get("containers", []):
                usage = c.get("usage", {})
                cpu   = usage.get("cpu", "0m")
                mem   = usage.get("memory", "0Ki")
                total_cpu += int(cpu.replace("n", "")) / 1_000_000 if "n" in cpu else int(cpu.replace("m", ""))
                total_mem += int(mem.replace("Ki", "")) // 1024 if "Ki" in mem else 0
        return {"cpu_used_millicores": round(total_cpu), "memory_used_mb": round(total_mem)}
    except Exception:
        return {"cpu_used_millicores": 0, "memory_used_mb": 0, "note": "metrics-server not available"}


# ── Main status endpoint ──────────────────────────────────────
@app.get("/status")
def control_plane_status(namespace: str = Query(default=None)):
    ns = namespace or DEFAULT_NAMESPACE
    try:
        pods  = get_pods(ns)
        nodes = get_nodes()
        eks   = get_eks_info()

        running = sum(1 for p in pods if p.get("status") == "Running")
        total   = len(pods)

        return {
            "cluster":           eks,
            "namespace":         ns,
            "registered_models": len(registered_models),
            "pods": {
                "total":   total,
                "running": running,
                "items":   pods,
            },
            "nodes": {
                "total": len(nodes),
                "items": nodes,
            },
            "metrics": get_resource_metrics(ns),
            "status":  "running",
            "version": "1.0.0",
        }
    except Exception as e:
        return {
            "cluster":           {"name": CLUSTER_NAME, "status": "Unknown", "version": "N/A", "region": AWS_REGION, "error": str(e)},
            "namespace":         ns,
            "registered_models": len(registered_models),
            "pods":    {"total": 0, "running": 0, "items": []},
            "nodes":   {"total": 0, "items": []},
            "metrics": {"cpu_used_millicores": 0, "memory_used_mb": 0},
            "status":  "degraded",
            "version": "1.0.0",
        }
