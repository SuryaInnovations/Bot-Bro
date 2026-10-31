/**
 * NOVA AI — Enterprise Load Balancer & Circuit Breaker
 * Distributes incoming traffic across horizontal workers and trips circuit breakers
 * on unhealthy nodes to maintain 24/7 continuous availability.
 */

import { clusterManager, ClusterNodeInfo } from "./cluster-manager";

export interface LoadBalancerDecision {
  targetNodeId: string;
  zone: string;
  algorithm: "least_connections" | "round_robin" | "weighted_latency";
}

class EnterpriseLoadBalancer {
  private rrIndex = 0;
  private circuitBreakers: Map<string, { failureCount: number; trippedUntil: number }> = new Map();

  /**
   * Selects optimal worker node for incoming request.
   */
  public selectWorkerNode(): LoadBalancerDecision {
    const nodes = clusterManager.getAllNodes();
    const now = Date.now();

    // Filter out unhealthy nodes and tripped circuit breakers
    const availableNodes = nodes.filter((node) => {
      if (node.status === "unhealthy" || node.status === "draining") return false;
      const cb = this.circuitBreakers.get(node.nodeId);
      if (cb && cb.trippedUntil > now) return false;
      return true;
    });

    if (availableNodes.length === 0) {
      // Graceful fallback to local node
      return {
        targetNodeId: clusterManager.getLocalNodeId(),
        zone: "local-fallback",
        algorithm: "least_connections",
      };
    }

    // Least connections algorithm
    let leastConnectedNode = availableNodes[0];
    for (const node of availableNodes) {
      if (node.activeConnections < leastConnectedNode.activeConnections) {
        leastConnectedNode = node;
      }
    }

    return {
      targetNodeId: leastConnectedNode.nodeId,
      zone: leastConnectedNode.zone,
      algorithm: "least_connections",
    };
  }

  public recordFailure(nodeId: string): void {
    const cb = this.circuitBreakers.get(nodeId) || { failureCount: 0, trippedUntil: 0 };
    cb.failureCount++;
    if (cb.failureCount >= 5) {
      // Trip circuit breaker for 30 seconds
      cb.trippedUntil = Date.now() + 30000;
    }
    this.circuitBreakers.set(nodeId, cb);
  }

  public recordSuccess(nodeId: string): void {
    const cb = this.circuitBreakers.get(nodeId);
    if (cb && cb.failureCount > 0) {
      cb.failureCount = Math.max(0, cb.failureCount - 1);
    }
  }
}

export const loadBalancer = new EnterpriseLoadBalancer();
