import type { NetworkBlueprint } from "./network-blueprint.types.js";

export class NetworkBlueprintService {
  read(): NetworkBlueprint {
    return {
      associations: [
        {
          code: "TEAMA",
          description: "A digital member hub for equipment and machinery businesses.",
          name: "TEAMA"
        },
        {
          code: "TAEF",
          description: "A connected association space for exporters and industry participation.",
          name: "TAEF"
        },
        {
          code: "EXPORT",
          description:
            "Shared intelligence, opportunities, and member discovery for export associations.",
          name: "Export Associations"
        },
        {
          code: "INDUSTRY",
          description: "Digital hubs for clusters, trade bodies, and industrial member groups.",
          name: "Industrial Associations"
        }
      ],
      capabilities: [
        {
          key: "directory",
          name: "Directory",
          description: "Verified business identities, capabilities, products, and contacts.",
          stage: "active"
        },
        {
          key: "leads",
          name: "Leads",
          description: "Qualified buyer and seller opportunities routed to relevant members.",
          stage: "next"
        },
        {
          key: "rfq",
          name: "RFQ",
          description: "Structured requirements with matching, response, and comparison workflows.",
          stage: "next"
        },
        {
          key: "capacity",
          name: "Capacity Exchange",
          description: "Share idle capacity and discover available production partners.",
          stage: "next"
        },
        {
          key: "networking",
          name: "Networking",
          description: "Business connections, introductions, updates, and trusted conversations.",
          stage: "next"
        },
        {
          key: "jobs",
          name: "Jobs",
          description: "Industry-specific hiring and workforce opportunity exchange.",
          stage: "next"
        },
        {
          key: "events",
          name: "Events",
          description: "Association meetings, buyer-seller meets, fairs, and knowledge sessions.",
          stage: "next"
        },
        {
          key: "finance",
          name: "Finance",
          description: "Working-capital pathways, payment readiness, and finance discovery.",
          stage: "next"
        },
        {
          key: "export-intelligence",
          name: "Export Intelligence",
          description: "Market signals, compliance updates, trends, and destination insights.",
          stage: "next"
        }
      ],
      formula: [
        "LinkedIn",
        "IndiaMART",
        "Fibre2Fashion",
        "Textile ERP Lite",
        "Capacity Exchange",
        "Association Hub",
        "Tirupur Connect"
      ],
      positioning: {
        primary: "The Digital Business Network of Tirupur",
        secondary: "The Textile Industry Operating System",
        reject: ["Business Directory", "IndiaMART Clone", "Textile Listing Site"]
      },
      roles: [
        {
          role: "super_admin",
          responsibilities: [
            "Platform controls",
            "Capability rollout",
            "Association governance",
            "Access and visibility"
          ]
        },
        {
          role: "admin",
          responsibilities: [
            "Profile review",
            "Member support",
            "Approvals",
            "Marketplace moderation"
          ]
        },
        {
          role: "client",
          responsibilities: [
            "Own business profile",
            "Post and update information",
            "Respond to opportunities",
            "Manage WhatsApp preference"
          ]
        }
      ],
      whatsapp: [
        {
          name: "WhatsApp inquiry",
          description: "Every public business profile can start a direct WhatsApp conversation."
        },
        {
          name: "WhatsApp lead alert",
          description: "Members can receive relevant opportunity alerts where they already work."
        },
        {
          name: "WhatsApp RFQ notification",
          description: "Matched suppliers can be notified as soon as a relevant RFQ opens."
        }
      ]
    };
  }
}
