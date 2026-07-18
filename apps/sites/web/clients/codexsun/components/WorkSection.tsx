"use client";

import { motion } from "framer-motion";

type SelectedWorkPreviewKind =
  | "platform"
  | "billing"
  | "zero"
  | "tasks"
  | "mail"
  | "storage"
  | "data"
  | "automation"
  | "reports";

type SelectedWorkCard = {
  title: string;
  category: string;
  description: string;
  href: string;
  preview: SelectedWorkPreviewKind;
  previewLabel: string;
  previewStatus: string;
  previewRows: readonly [string, string, string];
  previewMeta: string;
};

const PRODUCT_OUTCOMES = [
  {
    label: "Clarity",
    title: "One operating view",
    description:
      "Website, users, billing, and daily work stay connected in a workspace people can understand from the first click."
  },
  {
    label: "Control",
    title: "Every action stays accountable",
    description:
      "Focused workflows make sales, receipts, payments, reports, and operational decisions easier to follow and trust."
  },
  {
    label: "Growth",
    title: "A platform that expands with you",
    description:
      "Start with the tools you need today, then add customers, accounts, workflows, and operations without starting over."
  }
] as const;

const SELECTED_WORK_CARDS: readonly SelectedWorkCard[] = [
  {
    title: "CODEXSUN Platform",
    category: "Business Operating Platform",
    description:
      "A governed operating layer connecting identity, applications, companies, subscriptions, and daily work.",
    href: "/work/codexsun-platform",
    preview: "platform",
    previewLabel: "Platform core",
    previewStatus: "Live",
    previewRows: ["Tenant context", "Application access", "Company workspace"],
    previewMeta: "9 systems connected"
  },
  {
    title: "Billing Suite",
    category: "Billing, Collections & Control",
    description:
      "Quotations, sales, purchases, receipts, payments, exports, and reports in one accountable flow.",
    href: "/work/billing-suite",
    preview: "billing",
    previewLabel: "Invoice flow",
    previewStatus: "GST ready",
    previewRows: ["INV-2026-0847", "Tax verified", "₹15,520 posted"],
    previewMeta: "7 document flows"
  },
  {
    title: "ZERO",
    category: "Permission-Aware AI Companion",
    description:
      "Business intelligence that understands tenant, permission, workflow, confirmation, and audit boundaries.",
    href: "/work/zero-ai-companion",
    preview: "zero",
    previewLabel: "ZERO context",
    previewStatus: "Building",
    previewRows: ["Scope verified", "Context resolved", "Action confirmed"],
    previewMeta: "Permission first"
  },
  {
    title: "Work Manager",
    category: "Tasks & Operations",
    description:
      "Tasks, work orders, priorities, ownership, and deadlines made visible across teams and companies.",
    href: "/login",
    preview: "tasks",
    previewLabel: "Today's work",
    previewStatus: "6 active",
    previewRows: ["Review quotation", "Prepare dispatch", "Confirm payment"],
    previewMeta: "2 due today"
  },
  {
    title: "Mail Desk",
    category: "Business Communication",
    description:
      "A tenant-aware communication desk that keeps messages, records, attachments, and follow-ups together.",
    href: "/login",
    preview: "mail",
    previewLabel: "Shared inbox",
    previewStatus: "Synced",
    previewRows: ["Accounts", "Customer support", "Operations"],
    previewMeta: "12 unread"
  },
  {
    title: "Storage Manager",
    category: "Files & Records",
    description:
      "Structured business storage with ownership, context, controlled access, and a clear record trail.",
    href: "/login",
    preview: "storage",
    previewLabel: "Storage index",
    previewStatus: "Secure",
    previewRows: ["Commercial docs", "Company records", "Shared assets"],
    previewMeta: "Policy protected"
  },
  {
    title: "Data Bridge",
    category: "Import, Export & Movement",
    description:
      "Reliable data movement with mapping, validation, queue-backed processing, and readable outcomes.",
    href: "/login",
    preview: "data",
    previewLabel: "Bridge run",
    previewStatus: "Connected",
    previewRows: ["Source mapped", "1,248 validated", "Target ready"],
    previewMeta: "0 rejected rows"
  },
  {
    title: "Workflow Automation",
    category: "Rules & Repetitive Work",
    description:
      "Trigger repeatable actions from business events while keeping retries, ownership, and audit visible.",
    href: "/login",
    preview: "automation",
    previewLabel: "Active rule",
    previewStatus: "Running",
    previewRows: ["Invoice overdue", "Send reminder", "Create follow-up"],
    previewMeta: "14 runs this month"
  },
  {
    title: "Business Reports",
    category: "Operational Intelligence",
    description:
      "Focused dashboards and reports that turn billing, collections, work, and activity into decisions.",
    href: "/login",
    preview: "reports",
    previewLabel: "Live signals",
    previewStatus: "Current",
    previewRows: ["Revenue movement", "Outstanding trend", "Work completion"],
    previewMeta: "Updated now"
  }
] as const;

function SelectedWorkPreview({ item }: { item: SelectedWorkCard }) {
  return (
    <div className="work-selected-preview" data-preview={item.preview} aria-hidden="true">
      <div className="work-selected-preview-bar">
        <span>{item.previewLabel}</span>
        <em>{item.previewStatus}</em>
      </div>
      <div className="work-selected-preview-canvas">
        <div className="work-selected-preview-signal">
          <i />
          <i />
          <i />
        </div>
        <div className="work-selected-preview-rows">
          {item.previewRows.map((row, index) => (
            <span key={row}>
              <i />
              <b>{row}</b>
              <em>{index === 2 ? "Ready" : "OK"}</em>
            </span>
          ))}
        </div>
      </div>
      <div className="work-selected-preview-meta">
        <span>{item.previewMeta}</span>
        <i />
      </div>
    </div>
  );
}

export default function WorkSection() {
  return (
    <section
      id="work"
      className="work-section relative w-full overflow-hidden bg-frost text-carbon"
    >
      <div id="product-selected" className="section-band work-selected pb-20 md:pb-28">
        <div className="work-selected-heading">
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-20% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-quiet">
              Selected Work
            </span>
            <div className="mt-5 h-px w-8 bg-carbon" />
            <h2 className="work-selected-title font-display uppercase">
              Nine systems.
              <br />
              One operating rhythm.
            </h2>
            <p className="work-selected-intro">
              Compact product stories from the systems that run CODEXSUN—from platform control to
              billing, work, communication, automation, and intelligence.
            </p>
          </motion.div>
          <a href="#contact" className="work-view-link">
            Start a project <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="work-selected-grid">
          {SELECTED_WORK_CARDS.map((item, index) => (
            <motion.article
              key={item.title}
              className={`work-selected-card work-selected-card-tone-${(index % 6) + 1}`}
              initial={{ opacity: 0, y: 38, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, margin: "-10% 0px" }}
              transition={{
                delay: (index % 3) * 0.08,
                duration: 0.78,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <a href={item.href} className="work-selected-card-link">
                <SelectedWorkPreview item={item} />
                <div className="work-selected-card-content">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="work-selected-card-footer">
                    <span>{String(index + 1).padStart(2, "0")} / 09</span>
                    <em>
                      Explore <span aria-hidden="true">↗</span>
                    </em>
                  </div>
                </div>
              </a>
            </motion.article>
          ))}
        </div>

        <div className="work-selected-footer">
          <span>Nine connected systems. One product language.</span>
          <a href="#approach">
            See our process <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      <div id="product-outcomes" className="section-band work-outcomes">
        <div className="work-outcomes-grid">
          <motion.div
            className="work-outcomes-heading"
            initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, margin: "-18% 0px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Product Outcomes</span>
            <h2 className="font-display uppercase">
              Built to keep
              <br />
              business moving.
            </h2>
            <p>
              The product is complete only when daily work becomes clearer, more accountable, and
              easier to grow.
            </p>
            <div className="work-outcome-flow" aria-hidden="true">
              <div className="work-outcome-flow-header">
                <span>Operating signal</span>
                <em>Live</em>
              </div>
              <div className="work-outcome-flow-track">
                <i />
              </div>
              <div className="work-outcome-flow-nodes">
                {PRODUCT_OUTCOMES.map((outcome, index) => (
                  <span key={outcome.label}>
                    <i />
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <em>{outcome.label}</em>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="work-outcomes-list">
            {PRODUCT_OUTCOMES.map((outcome, index) => (
              <motion.article
                key={outcome.label}
                className="work-outcome-card"
                initial={{ opacity: 0, x: 48, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-16% 0px" }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.82,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <span className="work-outcome-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="work-outcome-copy">
                  <span>{outcome.label}</span>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.description}</p>
                </div>
                <div className="work-outcome-signal" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="work-outcomes-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: "-10% 0px" }}
          transition={{ delay: 0.25, duration: 0.8 }}
        >
          <span>{SELECTED_WORK_CARDS.length} connected product systems</span>
          <a href="#contact">
            Build your workspace <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
