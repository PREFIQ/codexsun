import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink, Layers3, LockKeyhole, Orbit, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getTenantPublicPortal } from "./tenant-portal.api";
import type { TenantPublicPortal } from "./tenant-portal.types";
import "./tenant-portal.css";

const fallbackPortal: TenantPublicPortal = {
  brandName: "Your workspace",
  configured: false,
  domain: "",
  eyebrow: "Business workspace",
  features: [
    {
      description:
        "Open every application assigned to your organisation from one governed workspace.",
      label: "01",
      title: "Connected applications"
    },
    {
      description:
        "Tenant identity and permissions keep each person inside the right operating context.",
      label: "02",
      title: "Secure by context"
    },
    {
      description: "Work and activity stay readable as more teams and workflows come online.",
      label: "03",
      title: "Operational clarity"
    }
  ],
  footerText: "Your business applications, brought together in one secure workspace.",
  headline: "One workspace. Clear work. Every day.",
  loginPath: "/login",
  posts: [
    {
      description:
        "A quick orientation for entering your workspace and finding enabled applications.",
      href: "/login",
      label: "Getting started",
      title: "Your workspace entry guide"
    },
    {
      description: "See how tenant-aware access keeps business work focused and accountable.",
      href: "/login",
      label: "Workspace note",
      title: "Access that follows context"
    },
    {
      description:
        "Sign in to see the applications and current updates available to your organisation.",
      href: "/login",
      label: "Inside the app",
      title: "What is ready for your team"
    }
  ],
  publicSiteUrl: null,
  slides: [
    {
      description:
        "Move from sign-in to the work that matters without searching across disconnected tools.",
      label: "Workspace",
      title: "A clearer start to every workday"
    },
    {
      description:
        "Your enabled applications, people, and operating context stay connected behind one entry point.",
      label: "Access",
      title: "One place for every active app"
    },
    {
      description: "Add capabilities as the business grows while the workspace remains familiar.",
      label: "Scale",
      title: "Built around the way your team evolves"
    }
  ],
  summary:
    "Enter a focused operating space for your applications, people, and daily business activity.",
  tenantCode: null,
  theme: "blue"
};

const featureIcons = [Layers3, LockKeyhole, Orbit];

export function TenantPortalPage() {
  const [portal, setPortal] = useState<TenantPublicPortal>(fallbackPortal);
  const [activeSlide, setActiveSlide] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    void getTenantPublicPortal()
      .then((data) => {
        if (active) {
          setPortal(data);
          document.title = `${data.brandName} | App Portal`;
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || portal.slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % portal.slides.length),
      6000
    );
    return () => window.clearInterval(timer);
  }, [portal.slides.length, reduceMotion]);

  useEffect(() => {
    if (activeSlide >= portal.slides.length) setActiveSlide(0);
  }, [activeSlide, portal.slides.length]);

  const slide = portal.slides[activeSlide] ?? fallbackPortal.slides[0]!;

  return (
    <main className="tenant-portal" data-theme={portal.theme}>
      <nav className="tenant-portal-nav" aria-label="Workspace portal navigation">
        <a className="tenant-portal-brand" href="#top" aria-label={`${portal.brandName} home`}>
          <span className="tenant-portal-mark" aria-hidden="true">
            <Sparkles />
          </span>
          <span>
            <strong>{portal.brandName}</strong>
            <small>Application portal</small>
          </span>
        </a>
        <div className="tenant-portal-menu">
          <a href="#workspace">Workspace</a>
          <a href="#features">Features</a>
          <a href="#updates">Updates</a>
          {portal.publicSiteUrl ? (
            <a href={portal.publicSiteUrl}>
              Public site <ExternalLink />
            </a>
          ) : null}
        </div>
        <a className="tenant-portal-login" href={portal.loginPath}>
          Open workspace <ArrowRight />
        </a>
      </nav>

      <section className="tenant-portal-hero" id="top">
        <div className="tenant-portal-hero-copy">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tenant-portal-eyebrow"
          >
            <i /> {portal.eyebrow}
          </motion.span>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.65 }}
          >
            {portal.headline}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.65 }}
          >
            {portal.summary}
          </motion.p>
          <div className="tenant-portal-actions">
            <a className="tenant-portal-primary" href={portal.loginPath}>
              Sign in to your workspace <ArrowRight />
            </a>
            {portal.publicSiteUrl ? (
              <a className="tenant-portal-secondary" href={portal.publicSiteUrl}>
                Visit public site
              </a>
            ) : null}
          </div>
          <div className="tenant-portal-trust">
            <span>
              <LockKeyhole /> Tenant-aware access
            </span>
            <span>
              <Orbit /> One operating context
            </span>
          </div>
        </div>

        <div className="tenant-portal-slider" id="workspace">
          <div className="tenant-portal-window-bar">
            <span>
              <i />
              <i />
              <i />
            </span>
            <em>{portal.tenantCode ?? "WORKSPACE"} / APP</em>
          </div>
          <div className="tenant-portal-slide-stage">
            <AnimatePresence mode="wait">
              <motion.article
                key={`${activeSlide}-${slide.title}`}
                initial={reduceMotion ? false : { opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>{slide.label}</span>
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
              </motion.article>
            </AnimatePresence>
            <div className="tenant-portal-orbit" aria-hidden="true">
              <i />
              <i />
              <i />
              <strong>{String(activeSlide + 1).padStart(2, "0")}</strong>
            </div>
          </div>
          <div className="tenant-portal-slider-nav" aria-label="Workspace highlights">
            {portal.slides.map((item, index) => (
              <button
                type="button"
                aria-label={`Show ${item.title}`}
                aria-current={index === activeSlide}
                key={item.title}
                onClick={() => setActiveSlide(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="tenant-portal-section" id="features">
        <header className="tenant-portal-section-heading">
          <span>Designed for daily work</span>
          <h2>The essentials stay close. The complexity stays out of the way.</h2>
        </header>
        <div className="tenant-portal-feature-grid">
          {portal.features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length]!;
            return (
              <motion.article
                key={feature.title}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.2, once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <div>
                  <Icon />
                  <span>{feature.label}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="tenant-portal-section tenant-portal-updates" id="updates">
        <header className="tenant-portal-section-heading">
          <span>Workspace journal</span>
          <h2>Useful notes for the people doing the work.</h2>
        </header>
        <div className="tenant-portal-post-grid">
          {portal.posts.map((post) => (
            <a href={post.href} key={post.title}>
              <span>{post.label}</span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <strong>
                Read inside workspace <ArrowRight />
              </strong>
            </a>
          ))}
        </div>
      </section>

      <footer className="tenant-portal-footer">
        <div>
          <span className="tenant-portal-mark" aria-hidden="true">
            <Sparkles />
          </span>
          <strong>{portal.brandName}</strong>
        </div>
        <p>{portal.footerText}</p>
        <div className="tenant-portal-footer-links">
          <a href={portal.loginPath}>Workspace login</a>
          <a href="/status">Platform status</a>
          {portal.publicSiteUrl ? <a href={portal.publicSiteUrl}>Public site</a> : null}
        </div>
      </footer>
    </main>
  );
}
