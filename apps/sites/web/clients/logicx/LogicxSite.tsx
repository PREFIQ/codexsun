import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { ArrowUpRight, Bot, Braces, Database, Globe2, ServerCog } from "lucide-react";
import { motion } from "framer-motion";
import { ClientCanvas } from "../../shared/ClientCanvas";
import { useClientDocument } from "../../shared/useClientDocument";

const services = [
  {
    icon: Braces,
    title: "Custom software",
    description:
      "Purpose-built applications that replace disconnected spreadsheets and manual operating steps."
  },
  {
    icon: Database,
    title: "Tally integration",
    description:
      "Reliable finance bridges with mapping, validation, reconciliation and recoverable sync."
  },
  {
    icon: ServerCog,
    title: "ERPNext delivery",
    description:
      "Practical implementation, customization and rollout shaped around how teams actually work."
  },
  {
    icon: Globe2,
    title: "Website engineering",
    description:
      "Fast, credible digital experiences built as maintainable systems—not disposable pages."
  },
  {
    icon: Bot,
    title: "Workflow automation",
    description:
      "Rule-based processes, approvals and notifications that reduce repetitive operational effort."
  },
  {
    icon: ServerCog,
    title: "Hosting and care",
    description:
      "Production setup, monitoring, enhancements and steady technical ownership after launch."
  }
] as const;

export function LogicxSite() {
  useClientDocument(
    "Logicx Info Tech | Practical software systems",
    "Custom software, ERPNext, Tally integration, website engineering and automation.",
    "#f6f9ff"
  );

  return (
    <ClientCanvas client="logicx" theme="blue">
      <header className="client-header client-wrap">
        <a className="client-brand" href="#top" aria-label="Logicx home">
          <span className="client-brand-mark">LX</span>
          Logicx Info Tech
        </a>
        <nav className="client-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#method">Method</a>
          <a href="#contact">Contact</a>
          <Button asChild size="sm">
            <a href="mailto:hello@logicx.in">
              Start a project <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </nav>
      </header>

      <main id="top">
        <section className="client-hero client-wrap">
          <motion.div
            className="client-hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="client-eyebrow">Software that connects the work</span>
            <h1>Practical systems. Built around your business.</h1>
            <p>
              Logicx Info Tech connects operations, finance and customer workflows through custom
              software, Tally integrations, ERPNext, websites and automation.
            </p>
            <div className="client-actions">
              <Button asChild size="lg">
                <a href="mailto:hello@logicx.in">
                  Discuss your workflow <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#services">Explore services</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="client-visual"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="client-visual-top">
              <span>Logicx / Connected stack</span>
              <span>Live architecture</span>
            </div>
            <div className="client-system-map">
              <div className="client-system-node">
                <Braces aria-hidden="true" size={20} />
                <strong>Operations</strong>
                <span>Custom workflows</span>
              </div>
              <div className="client-system-node">
                <Database aria-hidden="true" size={20} />
                <strong>Finance</strong>
                <span>Tally + ERPNext</span>
              </div>
              <div className="client-system-node">
                <Globe2 aria-hidden="true" size={20} />
                <strong>Experience</strong>
                <span>Web + lead systems</span>
              </div>
              <div className="client-system-node">
                <Bot aria-hidden="true" size={20} />
                <strong>Automation</strong>
                <span>Rules + integrations</span>
              </div>
            </div>
            <div className="client-visual-footer">
              <span>One dependable delivery partner</span>
              <span>logicx.in</span>
            </div>
          </motion.div>
        </section>

        <section className="client-section client-section-muted" id="services">
          <div className="client-wrap">
            <div className="client-section-heading">
              <span className="client-eyebrow">What we build</span>
              <div>
                <h2>Useful technology, joined properly.</h2>
                <p>
                  Each engagement starts with the real workflow, then chooses the smallest reliable
                  combination of product, integration and infrastructure needed to improve it.
                </p>
              </div>
            </div>
            <div className="client-card-grid">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.045, duration: 0.42 }}
                  >
                    <Card className="client-service-card">
                      <Icon aria-hidden="true" size={22} />
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="method">
          <div className="client-section-heading">
            <span className="client-eyebrow">Delivery method</span>
            <div>
              <h2>Clear from discovery to support.</h2>
              <p>
                We map the process, establish the data and integration boundaries, release in useful
                stages, and remain accountable after the system reaches production.
              </p>
            </div>
          </div>
          <div className="client-stats">
            <div className="client-stat">
              <strong>Discover first</strong>
              <span>Process, people, data and exceptions</span>
            </div>
            <div className="client-stat">
              <strong>Release in stages</strong>
              <span>Useful milestones with visible progress</span>
            </div>
            <div className="client-stat">
              <strong>Own the outcome</strong>
              <span>Documentation, monitoring and continued care</span>
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="contact">
          <div className="client-cta">
            <div>
              <h2>Make the next system easier to run.</h2>
              <p>
                Share the process that is slowing your team down. We will help shape a practical
                path from the current workflow to a dependable software system.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:hello@logicx.in">
                hello@logicx.in <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="client-footer client-wrap">
        <span>Logicx Info Tech</span>
        <span>Custom software · ERPNext · Tally · Websites · Automation</span>
      </footer>
    </ClientCanvas>
  );
}
