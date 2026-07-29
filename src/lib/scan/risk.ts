import type { RiskFlagKind, RiskSeverity } from "@/lib/types";

export interface RiskRuleInput {
  content: string;
  tools: string[];
  mcpServers: string[];
  owner: string | null;
  approvedMcpServers: string[];
  highImpactTools: string[];
}

export interface DetectedRisk {
  kind: RiskFlagKind;
  severity: RiskSeverity;
  message: string;
  evidence: string | null;
}

const credentialPatterns = [
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}/i,
  /sk-[A-Za-z0-9]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/
];

const localMcpPattern = /(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)/i;

export function detectRisks(input: RiskRuleInput): DetectedRisk[] {
  const risks: DetectedRisk[] = [];

  for (const pattern of credentialPatterns) {
    const match = input.content.match(pattern);
    if (match) {
      risks.push({
        kind: "inline_credentials",
        severity: "high",
        message: "Possible inline credential found in an AI artifact.",
        evidence: redactCredential(match[0])
      });
      break;
    }
  }

  for (const server of input.mcpServers) {
    if (localMcpPattern.test(server)) {
      risks.push({
        kind: "local_mcp",
        severity: "medium",
        message: "References a local or private MCP server that may not be centrally governed.",
        evidence: server
      });
    }

    if (input.approvedMcpServers.length && !input.approvedMcpServers.includes(server)) {
      risks.push({
        kind: "unapproved_mcp",
        severity: "medium",
        message: `References an MCP server that is not in the approved list: ${server}.`,
        evidence: server
      });
    }
  }

  const highImpact = new Set(input.highImpactTools.map((tool) => tool.toLowerCase()));
  for (const tool of input.tools) {
    if (highImpact.has(tool.toLowerCase())) {
      risks.push({
        kind: "high_impact_tool",
        severity: "high",
        message: `References a high-impact tool: ${tool}.`,
        evidence: tool
      });
    }
  }

  if (!input.owner) {
    risks.push({
      kind: "missing_owner",
      severity: "low",
      message: "No owner could be resolved from Git metadata.",
      evidence: null
    });
  }

  return risks;
}

function redactCredential(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 18)}...`;
}
